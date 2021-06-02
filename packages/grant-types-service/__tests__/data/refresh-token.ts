export const id_token_mock = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWQ3NWQ5MS00OTkyLTQxNmItYWIyYy0xNDZjMzI0YTk2MWQiLCJpc3MiOiJodHRwczovL2F1dGgudGlnZXItY3J1bmNoLmNvbSIsImF1ZCI6Imh0dHBzOi8vY2xpZW50LmV4YW1wbGUub3JnL2NiIiwiYXV0aF90aW1lIjoxNjIyMTIxOTA5MDIzLCJhdF9oYXNoIjoiTjJRNE4yRm1OVGRqWlQiLCJpYXQiOjE2MjIxMjE5MDksImV4cCI6MTYyMjEyMjUwOX0.sBu570pdVdXLOul-5_CKQo0-bqoWyPt6fOOgTncqw9Il8t6KxQvDWukPChiF57Z_diaTBwlLJWbqRIBSCldahVydWxTNRKjIF5xCgsAAfkQbLkd3CVXjhaaurYgS1Qy9XDD68PkKUWtzHdxuZQw5Qp5oaMPQ4pN5JkuMeY5oHztVuxPTi8RsmzYvIE9NrVhOQsjyCnoxrfa9olHbQ9kN6-1L_-1dgZrK8HNuj1kepEOI0n4s-tW2YUf9gIRefrpgHnLjOD5QexYEW93vXwvISDOsF3NSx18G5a2bceFoUquJGAKAn-AtkEeCMXVHLrRXUZVkmW-SxwI7YSVgnjCXdw"
export const refreshTokenInput = {
    grant_type:"refresh_token",
    client_id:"dee68621-0071-41ec-a2c6-641328ef5cc5",
    client_secret:"LEM6Bm-QLPIr0QUkv5S71tkQ7dDIKxAyWlFpSFRfHnQ=",
    refresh_token:"F3bSi2ap1WNbFysrqJhYpZtRKvLdBkq0da3USBJDpds=",
    scope:"openid profile",
    id_token:id_token_mock
}
export const userIdMock = "8b3692a8-4108-40d8-a6c3-dfccca3dd12c"
export const access_token_mock = "7d87af57ce8f555baf1e"
export const refresh_token_mock = "5c650ae3a110fc7a1bcc"
export const code_fake="F3bSi2ap1WNbFysrqJhYpZtRKvLdBkq0da3USBJDpds="
export const expected_token = {
    access_token:access_token_mock,
    token_type: 'Bearer',
    refresh_token: refresh_token_mock,
    expires_in: 600,
    id_token: id_token_mock
}
export const dataSourceRes = {
    sub:userIdMock, 
    client_id:refreshTokenInput.client_id,
    code:code_fake
}
export const validExpiredTokenPayload = {
    iss: "https://auth.tiger-crunch.com",
    aud: "a06293a0-e307-45b2-91b8-7be165f010b7",
    auth_time: 1622645918528,
    uaid: '59c73b8298d4f27533d5734da5726da55a842d5eebcf419c836164d01f918e94',
    at_hash: "wfPsw5xpx21O7oAhHKeUgoLzijDExLi1jWcJysYvFHQ=",
    rt_hash: "GsJkfoPKG5YnlAWDdrTyYeY1b1hqWV_jOqU8SX4buvQ=",
    iat: 1622645918,
    exp: 1622646518
}