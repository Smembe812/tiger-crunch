export const mockImplicitInput = {
    response_type: "id_token token",
    scope: "openid profile email",
    client_id:"8b3692a8-4108-40d8-a6c3-dfccca3dd12c",
    state:"af0ifjsldkj",
    redirect_uri:"https://findyourcat.com",
    nonce:"n-0S6_WzA2Mj"
}
export const mockCode = "e035f59aa817b211655a"
export const token = {
    id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MWQ3NWQ5MS00OTkyLTQxNmItYWIyYy0xNDZjMzI0YTk2MWQiLCJpc3MiOiJodHRwczovL2F1dGgudGlnZXItY3J1bmNoLmNvbSIsImF1ZCI6Imh0dHBzOi8vY2xpZW50LmV4YW1wbGUub3JnL2NiIiwiYXV0aF90aW1lIjoxNjIyMTIxOTA5MDIzLCJhdF9oYXNoIjoiTjJRNE4yRm1OVGRqWlQiLCJpYXQiOjE2MjIxMjE5MDksImV4cCI6MTYyMjEyMjUwOX0.sBu570pdVdXLOul-5_CKQo0-bqoWyPt6fOOgTncqw9Il8t6KxQvDWukPChiF57Z_diaTBwlLJWbqRIBSCldahVydWxTNRKjIF5xCgsAAfkQbLkd3CVXjhaaurYgS1Qy9XDD68PkKUWtzHdxuZQw5Qp5oaMPQ4pN5JkuMeY5oHztVuxPTi8RsmzYvIE9NrVhOQsjyCnoxrfa9olHbQ9kN6-1L_-1dgZrK8HNuj1kepEOI0n4s-tW2YUf9gIRefrpgHnLjOD5QexYEW93vXwvISDOsF3NSx18G5a2bceFoUquJGAKAn-AtkEeCMXVHLrRXUZVkmW-SxwI7YSVgnjCXdw',
    expires_in: 300,
    access_token: '7d87af57ce8f555baf1e',
    state: 'af0ifjsldkj',
    token_type: 'bearer',
    redirect_uri: 'https://findyourcat.com'
  }
export const expectedImpResponse = `${token.redirect_uri}?id_token=${token.id_token}&access_token=${token.access_token}&token_type=${token.token_type}&state=${token.state}&expires_in=300`