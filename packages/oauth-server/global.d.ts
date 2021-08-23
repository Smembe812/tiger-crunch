type CodeQuery = {
    response_type: string;
	scope: string;
	client_id: string;
	state: string;
	redirect_uri: string;
}
type ImplicitFlowQueryInput = {
    redirect_uri: string;
    response_type: string;
    client_id: string;
    scope: string;
    state: string;
    nonce: string;
}
type HybridFlowQueryInput = {
    redirect_uri: string;
    response_type: string;
    client_id: string;
    scope: string;
    state: string;
    nonce: string;
}
type RefreshToken = {
    grant_type: string;
    refresh_token: string;
    scope: string; 
}