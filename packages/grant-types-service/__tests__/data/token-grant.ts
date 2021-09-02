export const sidMock = '5d02f2f4c53c4cc81810e54a46c2610e97a1a3139e56fa4e6181a84986a50ba1.2fff140116c841e495415f4115891d89a3f806eae713c5f6ace6ce9e56330034'
export const tokenInputMock = {
	grant_type:'authorization_code',
	code:'F3bSi2ap1WNbFysrqJhYpZtRKvLdBkq0da3USBJDpds=',
	redirect_uri:'https%3A%2F%2Fclient.example.org%2Fcb',
	client_id:'dee68621-0071-41ec-a2c6-641328ef5cc5',
	client_secret:'LEM6Bm-QLPIr0QUkv5S71tkQ7dDIKxAyWlFpSFRfHnQ='
}
export const userIdMock = '8b3692a8-4108-40d8-a6c3-dfccca3dd12c'
export const access_token_mock = '7d87af57ce8f555baf1e'
export const refresh_token_mock = '5c650ae3a110fc7a1bcc'
export const id_token_mock = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWQ3NWQ5MS00OTkyLTQxNmItYWIyYy0xNDZjMzI0YTk2MWQiLCJpc3MiOiJodHRwczovL2F1dGgudGlnZXItY3J1bmNoLmNvbSIsImF1ZCI6Imh0dHBzOi8vY2xpZW50LmV4YW1wbGUub3JnL2NiIiwiYXV0aF90aW1lIjoxNjIyMTIxOTA5MDIzLCJhdF9oYXNoIjoiTjJRNE4yRm1OVGRqWlQiLCJpYXQiOjE2MjIxMjE5MDksImV4cCI6MTYyMjEyMjUwOX0.sBu570pdVdXLOul-5_CKQo0-bqoWyPt6fOOgTncqw9Il8t6KxQvDWukPChiF57Z_diaTBwlLJWbqRIBSCldahVydWxTNRKjIF5xCgsAAfkQbLkd3CVXjhaaurYgS1Qy9XDD68PkKUWtzHdxuZQw5Qp5oaMPQ4pN5JkuMeY5oHztVuxPTi8RsmzYvIE9NrVhOQsjyCnoxrfa9olHbQ9kN6-1L_-1dgZrK8HNuj1kepEOI0n4s-tW2YUf9gIRefrpgHnLjOD5QexYEW93vXwvISDOsF3NSx18G5a2bceFoUquJGAKAn-AtkEeCMXVHLrRXUZVkmW-SxwI7YSVgnjCXdw'
export const code_fake='F3bSi2ap1WNbFysrqJhYpZtRKvLdBkq0da3USBJDpds='
export const expected_token = {
	access_token:access_token_mock,
	token_type: 'Bearer',
	refresh_token: refresh_token_mock,
	expires_in: 600,
	id_token: id_token_mock
}
export const dataSourceRes = {
	sub:userIdMock, 
	client_id:tokenInputMock.client_id,
	code:code_fake,
	scope:''
}