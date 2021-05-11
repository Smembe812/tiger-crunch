export default class DBPool {
    pool: any;
    constructor(name: any);
    insert(obj: any): Promise<any>;
    get(email: any): Promise<any>;
    delete(email: any): Promise<any>;
}
