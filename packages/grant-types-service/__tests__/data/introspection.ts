export const id_token_mock = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWQ3NWQ5MS00OTkyLTQxNmItYWIyYy0xNDZjMzI0YTk2MWQiLCJpc3MiOiJodHRwczovL2F1dGgudGlnZXItY3J1bmNoLmNvbSIsImF1ZCI6Imh0dHBzOi8vY2xpZW50LmV4YW1wbGUub3JnL2NiIiwiYXV0aF90aW1lIjoxNjIyMTIxOTA5MDIzLCJhdF9oYXNoIjoiTjJRNE4yRm1OVGRqWlQiLCJpYXQiOjE2MjIxMjE5MDksImV4cCI6MTYyMjEyMjUwOX0.sBu570pdVdXLOul-5_CKQo0-bqoWyPt6fOOgTncqw9Il8t6KxQvDWukPChiF57Z_diaTBwlLJWbqRIBSCldahVydWxTNRKjIF5xCgsAAfkQbLkd3CVXjhaaurYgS1Qy9XDD68PkKUWtzHdxuZQw5Qp5oaMPQ4pN5JkuMeY5oHztVuxPTi8RsmzYvIE9NrVhOQsjyCnoxrfa9olHbQ9kN6-1L_-1dgZrK8HNuj1kepEOI0n4s-tW2YUf9gIRefrpgHnLjOD5QexYEW93vXwvISDOsF3NSx18G5a2bceFoUquJGAKAn-AtkEeCMXVHLrRXUZVkmW-SxwI7YSVgnjCXdw'
export const introspectionInput = {
	client_id:'bd7e5e97-afe4-4796-b757-690ddc79ebb2',
	client_secret:'p4ETQXS1qpoMyiSdWhzjF6fz-u7ot2hD47ZQuCGwuG0=',
	token:'F3bSi2ap1WNbFysrqJhYpZtRKvLdBkq0da3USBJDpds=',
	token_hint:'access_token'
}
export const userIdMock = '8b3692a8-4108-40d8-a6c3-dfccca3dd12c'
export const access_token_mock = '7d87af57ce8f555baf1e'
export const refresh_token_mock = '5c650ae3a110fc7a1bcc'
export const code_fake='F3bSi2ap1WNbFysrqJhYpZtRKvLdBkq0da3USBJDpds='
export const expected_introspection_response = {
	active: true,
	scope: null,
	token_type: 'Bearer',
	exp: 1723073141,
	iat: 1623072541,
	sub: 'ec6ad4f7-d9f2-4dbe-b43f-3713f7227d78',
	aud: 'bd7e5e97-afe4-4796-b757-690ddc79ebb2',
	iss: 'https://auth.tiger-crunch.com',
	auth_time: 1623072541643
}
export const expected_introspection_expired_response = {
	active: false
}
export const dataSourceRes = {
	sub:userIdMock, 
	client_id:introspectionInput.client_id,
	code:code_fake
}
export const validIdTokenPayload = {
	iss: 'https://auth.tiger-crunch.com',
	aud: 'bd7e5e97-afe4-4796-b757-690ddc79ebb2',
	sub: 'ec6ad4f7-d9f2-4dbe-b43f-3713f7227d78',
	auth_time: 1623072541643,
	at_hash: 'wfPsw5xpx21O7oAhHKeUgoLzijDExLi1jWcJysYvFHQ=',
	rt_hash: 'GsJkfoPKG5YnlAWDdrTyYeY1b1hqWV_jOqU8SX4buvQ=',
	iat: 1623072541,
	exp: 1723073141
}
export const validExpiredIdTokenPayload = {
	iss: 'https://auth.tiger-crunch.com',
	aud: 'bd7e5e97-afe4-4796-b757-690ddc79ebb2',
	sub: 'ec6ad4f7-d9f2-4dbe-b43f-3713f7227d78',
	auth_time: 1623072541643,
	at_hash: 'wfPsw5xpx21O7oAhHKeUgoLzijDExLi1jWcJysYvFHQ=',
	rt_hash: 'GsJkfoPKG5YnlAWDdrTyYeY1b1hqWV_jOqU8SX4buvQ=',
	iat: 1623072541,
	exp: 1623073141
}
export const wrong_token_id_payload = {
	iss: 'https://auth.tiger-crunch.com',
	aud: 'ec6ad4f7-d9f2-4dbe-b43f-3713f7227d78',
	sub: 'ec6ad4f7-d9f2-4dbe-b43f-3713f7227d78',
	auth_time: 1623072541643,
	at_hash: 'wfPsw5xpx21O7oAhHKeUgoLzijDExLi1jWcJysYvFHQ=',
	rt_hash: 'GsJkfoPKG5YnlAWDdrTyYeY1b1hqWV_jOqU8SX4buvQ=',
	iat: 1623072541,
	exp: 1723073141
}
