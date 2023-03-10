import { Page } from '../../helpers/Page';

export class ErrorPage extends Page {
    constructor(id: string) {
        super(id);
    }

    render(): void {
        this.page.innerHTML = '';
        const title = document.createElement('h1');
        const errorText = document.createElement('h2');
        title.innerText = '404';
        errorText.innerText = 'Page Not Found';
        this.page.append(title, errorText);
    }
}
