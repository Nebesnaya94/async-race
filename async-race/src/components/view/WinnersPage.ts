import { Page } from '../../helpers/Page';
import {
    createSwitchPageBlock,
    createBlock,
    createTitle,
    createTableData,
    createCarImg,
} from '../../helpers/createElements';
import { WinnersAPI, OrderResult, SortResult } from '../CarsAPI/winnersRepository';
import { GarageAPI } from '../CarsAPI/garageRepository';
import { createPaginationBlock, paginationClassesForElements } from './PaginationBlock';
import { Saved } from '../../helpers/common';

const columnsNames = {
    number: 'Number',
    car: 'Car',
    name: 'Name',
    wins: 'Wins',
    time: 'Best time (seconds)',
};

export class WinnersPage extends Page {
    private totalWinners = 0;
    private winnersPerPage = 10;

    constructor(id: string) {
        super(id);
    }

    async render(): Promise<void> {
        this.page.innerHTML = '';
        const switchPage = createSwitchPageBlock();
        const winnersBlock = this.createWinnersBlock();
        const paginationBlock = createPaginationBlock({
            nextHandler: () => this.changePageHandler(1),
            prevHandler: () => this.changePageHandler(-1),
        });
        this.page.append(switchPage, await winnersBlock, paginationBlock);

        this.totalWinners = await WinnersAPI.getNumberOfWinners();
        this.togglePrevNextPageButtons();
    }

    private changePageHandler(step: 1 | -1): void {
        const winnersContainer: HTMLDivElement | null = document.querySelector('.winners-block');

        if (winnersContainer) {
            Saved.winnersPageNumber += step;
            this.editPaginationTitle();
            this.togglePrevNextPageButtons();
            this.render();
        }
    }

    private get maxPage(): number {
        return Math.ceil(this.totalWinners / this.winnersPerPage);
    }

    private togglePrevNextPageButtons(): void {
        const prevPageEl: HTMLButtonElement | null = document.querySelector(
            `.${paginationClassesForElements.prevButton}`
        );
        const nextPageEl: HTMLButtonElement | null = document.querySelector(
            `.${paginationClassesForElements.nextButton}`
        );

        if (prevPageEl && nextPageEl) {
            prevPageEl.disabled = !(Saved.winnersPageNumber > 1);
            nextPageEl.disabled = Saved.winnersPageNumber === this.maxPage;
        }
    }

    private editPaginationTitle(): void {
        const title: HTMLHeadElement | null = document.querySelector('h2');
        if (title) {
            title.innerText = `Page #${Saved.winnersPageNumber}`;
        }
    }

    private async createWinnersBlock(): Promise<HTMLDivElement> {
        const block = createBlock('winners-block');
        const { title, page } = createTitle('Winners', Saved.winnersPageNumber);
        const winnersTable = document.createElement('table');
        const tHead = this.createTableTitle();
        const tBody = document.createElement('tbody');
        await this.createWinners(tBody);
        winnersTable.append(tHead, tBody);
        block.append(title, page, winnersTable);
        return block;
    }

    private createTableTitle(): HTMLTableSectionElement {
        const head = document.createElement('thead');
        const title = document.createElement('tr');
        const number = createTableData(
            columnsNames.number,
            (title: string) => this.sortWinners(title),
            Saved.currentSort === SortResult.id ? Saved.currentOrder : undefined
        );
        const car = createTableData(columnsNames.car);
        const name = createTableData(columnsNames.name);
        const wins = createTableData(
            columnsNames.wins,
            (title: string) => this.sortWinners(title),
            Saved.currentSort === SortResult.wins ? Saved.currentOrder : undefined
        );
        const bestTime = createTableData(
            columnsNames.time,
            (title: string) => this.sortWinners(title),
            Saved.currentSort === SortResult.time ? Saved.currentOrder : undefined
        );
        title.append(number, car, name, wins, bestTime);
        head.append(title);
        return head;
    }

    private sortWinners(title: string) {
        switch (title) {
            case columnsNames.number:
                Saved.currentSort = SortResult.id;
                break;
            case columnsNames.wins:
                Saved.currentSort = SortResult.wins;
                break;
            case columnsNames.time:
                Saved.currentSort = SortResult.time;
                break;
        }

        Saved.currentOrder = Saved.currentOrder === OrderResult.asc ? OrderResult.desc : OrderResult.asc;

        this.render();
    }

    private async createWinners(winners: HTMLDivElement): Promise<HTMLDivElement> {
        winners.innerHTML = '';
        let num = 0;
        const winnersData = await WinnersAPI.getWinners({
            limit: this.winnersPerPage,
            page: Saved.winnersPageNumber,
            sort: Saved.currentSort,
            order: Saved.currentOrder,
        });
        for (const winner of winnersData) {
            const winnerRow = document.createElement('tr');
            const numCell = createTableData(`${++num}`);
            const winCar = await GarageAPI.getCar(winner.id);
            const carCell = createTableData('');
            carCell.innerHTML = createCarImg(winCar.color);
            const nameCell = createTableData(`${winCar.name}`);
            const winsCell = createTableData(`${winner.wins}`);
            const bestTimeCell = createTableData(`${winner.time}`);
            winnerRow.append(numCell, carCell, nameCell, winsCell, bestTimeCell);
            winners.append(winnerRow);
        }
        return winners;
    }
}
