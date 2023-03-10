export abstract class Page {
    protected page: HTMLElement = document.body;

    constructor(id: string) {
        this.page.id = id;
    }

    render(): void {
        this.page.innerHTML = '';
    }
}
