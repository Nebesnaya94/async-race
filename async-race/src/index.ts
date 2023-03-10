import { Page } from './helpers/Page';
import { PageIds } from './helpers/common';
import { GaragePage } from './components/view/GaragePage';
import { WinnersPage } from './components/view/WinnersPage';
import { ErrorPage } from './components/view/ErrorPage';
import './styles/styles.css';

class App {
    private enableRouteChange(): void {
        const pageAddressChangedHandler = () => {
            const hash = window.location.hash.slice(1);
            App.renderNewPage(hash);
        };

        window.addEventListener('hashchange', () => {
            pageAddressChangedHandler();
        });
        window.addEventListener('load', () => {
            pageAddressChangedHandler();
        });
    }

    static renderNewPage(idPage: string): void {
        let page: Page | null = null;

        if (idPage === PageIds.GaragePage || idPage.length === 0) {
            page = new GaragePage(idPage);
        } else if (idPage === PageIds.WinnersPage) {
            page = new WinnersPage(idPage);
        } else {
            page = new ErrorPage(idPage);
        }

        if (page) {
            page.render();
        }
    }

    run(): void {
        this.enableRouteChange();
    }
}

const body = new App();
body.run();

console.log(`Перед проверкой задания запустите сервер:
https://github.com/mikhama/async-race-api`);
