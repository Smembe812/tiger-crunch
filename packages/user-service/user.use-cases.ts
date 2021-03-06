/**
 * create a new user
 * 1. get user details from http
 * 2. validate fields with UserEntity
 * 2. verify the user
 * 3. setup 2 factor
 * @param param0 
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function ({
	userEntity, 
	dataSource, 
	mailManager, 
	identityManager,
	otpService,
	util
}){
	async function createNewUser(userFields: UserInput) : Promise<UserResponse>{
		const id = await util.uuidV4()
		const newUser = await userEntity.create({...userFields, id})
		const {pin, ...user} = await dataSource.insert(newUser)
		const userResponse = user
		mailManager.sendMail({
			to:userResponse.email,
			subject:'Account Activation',
			text:`Welcome, ${userResponse.name}. Please click this https://link.com to activate your account`
		})
			.catch(err => console.log('error sending activation link', err))
		return userResponse
	}
	async function verifyUser({proposedPIN,otp, email}):Promise<boolean>{
		const {pin:storedPin, ...persisedUser} = await dataSource.get(email)
		const isPinValid = await identityManager.isValidPin({
			proposedPIN, 
			salt: storedPin.salt, 
			iterations:storedPin.iterations,
			hash: storedPin.hash
		})
		if(persisedUser.twoFactor){
			const verified = await verifyOTP({
				user:{secret:persisedUser.twoFactor.secret},
				token:otp
			})
			return isPinValid && verified
		}
		return isPinValid
	}
	async function verifyOTP({user, token}):Promise<boolean>{
		const verified = otpService.verify({
			secret: user.secret,
			encoding: 'base32',
			token
		})
		return verified
	}
	async function verify2faSetup({email},token):Promise<boolean>{
		const user = await dataSource.get(email)
		const isVerified = await verifyOTP({
			user:{secret:user.twoFactor.tempSecret}, 
			token
		})
		if(isVerified){
			user.twoFactor.secret = user.twoFactor.tempSecret
			delete user.twoFactor.tempSecret
			await dataSource.insert(user)
		}
		return isVerified
	}
	async function setUp2FA({email, proposedPIN}){
		const verifiedUser = await verifyUser({email, proposedPIN, otp:null})
		if (verifiedUser){
			const cUser = await dataSource.get(email)
			const {secret, data_url} = await otpService.generateQRCode()
			cUser.twoFactor = {
				secret: '',
				tempSecret: secret.base32,
				dataURL: data_url,
				otpURL: secret.otpauth_url
			}
			await dataSource.insert(cUser)
			return Promise.resolve(data_url)
		}
	}
	async function getUser({email, id}){
		let user
		if(!email){
			const {pin, ...person} = await dataSource.getById(id)
			user = person
		}else{
			const {pin, ...person} = await dataSource.get(email)
			user = person
		}
		return user
	}
	function isOwner(ctx, target){
		const {id, email} = ctx.user
		return target.user.id === id
	}
	// function isAdmin(ctx){
	//     const scope = getScopes(ctx.user.id)
	//     const validScope =  scope.includes(ctx.user.scope)
	//     return validScope.isAdmin
	// }
	return {
		createNewUser,
		verifyUser,
		setUp2FA,
		verify2faSetup,
		getUser
	}
}