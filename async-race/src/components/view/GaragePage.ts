import { Page } from '../../helpers/Page';
import {
    createBlock,
    createButton,
    createSwitchPageBlock,
    createInput,
    createCarImg,
    createTitle,
    createRandonName,
    createRandomColor,
} from '../../helpers/createElements';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CarFlag = require('../../assets/images/flag.png');
import { GarageAPI } from '../CarsAPI/garageRepository';
import { getClosestButtonInWrapper, classesForElements } from '../../helpers/raceHelpers';
import { IRacingParameters, DriveStatus, EngineAPI, EngineStatus } from '../CarsAPI/engineRepository';
import { ICar, Saved } from '../../helpers/common';
import { WinnersAPI, IWinner, IWinnerInfo } from '../CarsAPI/winnersRepository';
import { WinnerModal } from './WinnerModal';
import { createPaginationBlock, paginationClassesForElements } from './PaginationBlock';

export class GaragePage extends Page {
    currentCarId: number;
    private carAnimations: { [id: number]: number } = {};
    private cars: ICar[] = [];
    private carsElements: { [id: number]: HTMLDivElement } = {};
    private isRaceOn = false;
    private winnerModal: WinnerModal;
    private abortController = new AbortController();
    private startedCarsCounter = 0;
    private carsPerPage = 7;
    private totalCars = 0;

    constructor(id: string) {
        super(id);
        this.currentCarId = 0;
        this.winnerModal = new WinnerModal();
    }

    async render(): Promise<void> {
        this.page.innerHTML = '';
        const switchPage = createSwitchPageBlock();
        const carInputsBlock = this.createInputsWrapper();
        const carsBlock = await this.createCarsWrapper();
        const paginationBlock = createPaginationBlock({
            nextHandler: () => this.changePageHandler(1),
            prevHandler: () => this.changePageHandler(-1),
        });
        const winnerModalElement: HTMLDivElement = this.winnerModal.render();
        carsBlock.append(winnerModalElement);
        this.page.append(switchPage, await carInputsBlock, carsBlock, paginationBlock);
        if (Saved.selectedId === -1) {
            this.updateDisabledState(true);
            this.editUpdateCarInputs('', '#FFFBF3');
        }
        this.addCarsCounter();
        this.saveEditInputsState();
        this.totalCars = await GarageAPI.getNumberOfCars();
        this.togglePrevNextPageButtons();
    }

    private async addCarsCounter(): Promise<void> {
        const title = document.querySelector('h1');
        const counter = await GarageAPI.getNumberOfCars();
        if (title) {
            title.innerText = `Garage (${counter})`;
        }
    }

    private get maxPage(): number {
        return Math.ceil(this.totalCars / this.carsPerPage);
    }

    private changePageHandler(step: 1 | -1): void {
        const carsContainer: HTMLDivElement | null = document.querySelector('.cars-container');

        if (carsContainer) {
            Saved.garagePageNumber += step;
            this.createCars(carsContainer);
            this.togglePrevNextPageButtons();
        }
        this.editPaginationTitle();
    }

    private togglePrevNextPageButtons(): void {
        const prevPageEl: HTMLButtonElement | null = document.querySelector(
            `.${paginationClassesForElements.prevButton}`
        );
        const nextPageEl: HTMLButtonElement | null = document.querySelector(
            `.${paginationClassesForElements.nextButton}`
        );
        if (prevPageEl && nextPageEl) {
            prevPageEl.disabled = !(Saved.garagePageNumber > 1);
            nextPageEl.disabled = Saved.garagePageNumber === this.maxPage;
        }
    }

    private editPaginationTitle(): void {
        const title = document.querySelector('h2') as HTMLElement;
        title.innerText = `Page #${Saved.garagePageNumber}`;
    }

    private async createInputsWrapper(): Promise<HTMLDivElement> {
        const block = createBlock('inputs-block');
        const addCarBlock = this.createAddCarBlock();
        const updateCarBlock = this.createUpdateCarBlock();
        const buttonsBlock = createBlock('buttons-container');
        const raceBtn = this.createRaceButton();
        const resetBtn = this.createResetButton();
        const generateBtn = createButton('generate-cars', 'btn-generate');
        generateBtn.addEventListener('click', async () => {
            for (let i = 0; i < 100; i++) {
                await GarageAPI.createCar({ name: createRandonName(), color: createRandomColor() });
            }
            this.render();
        });
        buttonsBlock.append(raceBtn, resetBtn, generateBtn);
        block.append(addCarBlock, updateCarBlock, buttonsBlock);
        return block;
    }

    private createResetButton(): HTMLButtonElement {
        const button = createButton('reset', classesForElements.resetButton);
        button.disabled = true;
        button.addEventListener('click', () => {
            this.toggleRaceStartStop();
            this.stopRaceHandler();
            this.winnerModal.hideModal();
            this.abortController = new AbortController();
        });
        return button;
    }

    private createRaceButton(): HTMLButtonElement {
        const button = createButton('race', classesForElements.raceButton);
        button.addEventListener('click', async () => {
            this.toggleRaceStartStop();
            await this.startRaceHandler();
        });
        return button;
    }

    private async startRaceHandler(): Promise<void> {
        const raceParams: (DriveStatus | IRacingParameters)[] = await Promise.all(
            this.cars.map((car: ICar) => EngineAPI.startStopEngine(car.id, EngineStatus.started))
        );
        const raceStatusPromises: Promise<IWinnerInfo>[] = [];
        raceParams.forEach((param, index) => {
            if (typeof param === 'object') {
                const car: ICar = this.cars[index];
                const carElement = this.carsElements[car.id];
                const { velocity, distance } = param;
                const raceDuration: number = distance / velocity;
                this.moveToFlag(car.id, carElement, raceDuration);
                const raceStatusPromise: Promise<IWinnerInfo> = new Promise((res) => {
                    EngineAPI.drive(car.id, this.abortController.signal).then((status) => {
                        if (status === DriveStatus.success) {
                            res({ carId: car.id, raceDuration });
                        } else if (status === DriveStatus.stopped) {
                            this.engineBroken(car.id);
                        }
                    });
                });
                raceStatusPromises.push(raceStatusPromise);
            }
        });
        Promise.race(raceStatusPromises).then((winnerInfo: IWinnerInfo) => this.carWin(winnerInfo));
    }

    private async stopRaceHandler(): Promise<void> {
        this.abortController.abort();
        const stopEnginePromises = this.cars.map((car: ICar) =>
            EngineAPI.startStopEngine(car.id, EngineStatus.stopped)
        );
        await Promise.all(stopEnginePromises);
        this.cars.forEach((car: ICar) => {
            this.stopCarAnimation(car.id);
        });
        Object.values(this.carsElements).forEach((carEl: HTMLDivElement) => {
            const car: HTMLDivElement = carEl;
            car.style.transform = `translateX(0px)`;
        });
    }

    private engineBroken(carId: number): void {
        const brokenCar: ICar | undefined = this.cars.find((car: ICar) => car.id === carId);
        if (brokenCar) {
            console.log(`Car ${brokenCar?.name}: engine broken`);
        }
        this.stopCarAnimation(carId);
    }

    private async carWin(winnerInfo: IWinnerInfo): Promise<void> {
        if (this.isRaceOn === false) {
            return;
        }
        const { carId, raceDuration } = winnerInfo;
        const raceTime: number = Math.round((raceDuration / 1000) * 100) / 100;
        const winnerCar: ICar | undefined = this.cars.find((car: ICar) => car.id === carId);
        if (winnerCar) {
            const winnerText = `Winner is ${winnerCar.name}! Race time: ${raceTime} sec.`;
            this.winnerModal.showModalWithText(winnerText);
        }
        const pastWinner: IWinner = await WinnersAPI.getWinner(carId);
        if ('id' in pastWinner) {
            const bestTime: number = Math.min(pastWinner.time, raceTime);
            await WinnersAPI.updateWinner(carId, {
                wins: pastWinner.wins + 1,
                time: bestTime,
            });
        } else {
            await WinnersAPI.createWinner({
                id: carId,
                wins: 1,
                time: raceTime,
            });
        }
    }

    private toggleRaceResetButtons(): void {
        const raceButton: HTMLButtonElement | null = document.querySelector(`.${classesForElements.raceButton}`);
        const resetButton: HTMLButtonElement | null = document.querySelector(`.${classesForElements.resetButton}`);
        if (raceButton && resetButton) {
            raceButton.disabled = this.isRaceOn;
            resetButton.disabled = !this.isRaceOn;
        }
    }

    private toggleStartButtons(): void {
        const startButtons: NodeListOf<HTMLButtonElement> | null = document.querySelectorAll(
            `.${classesForElements.startButton}`
        );
        startButtons.forEach((button: HTMLButtonElement) => {
            button.disabled = this.isRaceOn;
        });
    }

    private toggleRaceStartStop(): void {
        this.isRaceOn = !this.isRaceOn;
        this.toggleRaceResetButtons();
        this.toggleStartButtons();
    }

    private createUpdateCarBlock(): HTMLDivElement {
        const updateCarBlock = createBlock('update-car');
        const updateCarName = createInput('text', 'text-update update');
        updateCarName.value = Saved.selectedName;
        const updateCarColor = createInput('color', 'color-update update');
        updateCarColor.value = Saved.selectedColor;
        const updateCarBtn = createButton('update', 'btn-update update');
        updateCarBtn.addEventListener('click', async () => {
            if (Saved.selectedId !== -1) {
                this.currentCarId = Saved.selectedId;
            }
            await GarageAPI.updateCar(this.currentCarId, { name: updateCarName.value, color: updateCarColor.value });
            this.editUpdateCarInputs('', '#FFFBF3', -1);
            this.render();
        });
        updateCarBlock.append(updateCarName, updateCarColor, updateCarBtn);
        return updateCarBlock;
    }

    private createAddCarBlock(): HTMLDivElement {
        const addCarBlock = createBlock('create-car');
        const addCarName = createInput('text');
        addCarName.value = Saved.createdName;
        const addCarColor = createInput('color');
        addCarColor.value = Saved.createdColor;
        const addCarBtn = createButton('create', 'btn-create');
        addCarBtn.addEventListener('click', async () => {
            await GarageAPI.createCar({ name: addCarName.value, color: addCarColor.value });
            Saved.createdName = '';
            Saved.createdColor = '#9424C8';
            this.render();
        });
        addCarBlock.append(addCarName, addCarColor, addCarBtn);
        return addCarBlock;
    }

    private async createCarsWrapper(): Promise<HTMLDivElement> {
        const block = createBlock(classesForElements.carsBlock);
        const { title, page } = createTitle('Garage', Saved.garagePageNumber);
        const cars = createBlock('cars-container');
        await this.createCars(cars);
        block.append(title, page, cars);
        return block;
    }

    private async createCars(cars: HTMLDivElement): Promise<void> {
        cars.innerHTML = '';
        const carsData = await GarageAPI.getCars({
            limit: this.carsPerPage,
            page: Saved.garagePageNumber,
        });
        this.cars = carsData;
        this.carsElements = {};
        for (const car of carsData) {
            const carBlock = createBlock('car');
            const carName = createBlock('car-name');
            const trackBlock = createBlock('car-track');
            carName.innerText = `${car.name}`;
            const btnSelect = this.createSelectCarButton(car);
            if (Saved.selectedId === car.id) {
                btnSelect.classList.add('selected');
            }
            const btnRemove = this.createRemoveCarButton(car);
            carName.prepend(btnSelect, btnRemove);
            const carRace = createBlock('car-race');
            const carImg = createBlock('car-img');
            carImg.innerHTML = createCarImg(car.color);
            const flagImg = document.createElement('img');
            flagImg.src = CarFlag;
            flagImg.alt = 'flag';
            flagImg.classList.add('race-flag');
            trackBlock.append(carImg, flagImg);
            const engineControlBlock = this.createEngineBlock(car.id, carImg);
            carRace.append(engineControlBlock, trackBlock);
            carBlock.append(carName, carRace);
            cars.append(carBlock);
            this.carsElements[car.id] = carImg;
        }
        this.addCarsCounter();
    }

    private createRemoveCarButton(car: ICar): HTMLButtonElement {
        const btnRemove = createButton('remove', 'btn-remove');
        btnRemove.addEventListener('click', async () => {
            const isWinner = await WinnersAPI.getWinner(car.id);
            if (isWinner.wins) {
                await WinnersAPI.deleteWinner(car.id);
            }
            await GarageAPI.deleteCar(car.id);
            if (Saved.selectedId === car.id) {
                this.editUpdateCarInputs('', '#FFFBF3', -1);
            }
            this.render();
        });
        return btnRemove;
    }

    private createSelectCarButton(car: ICar): HTMLButtonElement {
        const btnSelect = createButton('select', 'btn-select');
        btnSelect.addEventListener('click', () => {
            this.currentCarId = car.id;
            for (const btn of document.querySelectorAll('.btn-select')) {
                btn.classList.remove('selected');
            }
            btnSelect.classList.add('selected');
            this.updateDisabledState();
            (document.querySelector('.text-update') as HTMLInputElement).value = car.name;
            (document.querySelector('.color-update') as HTMLInputElement).value = car.color;
            this.editUpdateCarInputs(car.name, car.color, car.id);
        });
        return btnSelect;
    }

    private createEngineBlock(carId: number, carImg: HTMLDivElement): HTMLDivElement {
        const engineControlBlock = createBlock('car-engine');
        const startEngineButton = this.createStartEngineButton(carId, carImg);
        const stopEngineButton = this.createStopEngineButton(carId, carImg);
        engineControlBlock.append(startEngineButton, stopEngineButton);
        return engineControlBlock;
    }

    private createStartEngineButton(carId: number, carImg: HTMLDivElement): HTMLButtonElement {
        const button = createButton('start', classesForElements.startButton);
        button.addEventListener('click', async (ev: MouseEvent) => {
            const stopButton = getClosestButtonInWrapper(
                ev.target as HTMLButtonElement,
                `.${classesForElements.stopButton}`
            );
            if (stopButton) stopButton.disabled = false;
            button.disabled = true;
            this.enableRaceButton(false);
            const raceParams: IRacingParameters | DriveStatus = await EngineAPI.startStopEngine(
                carId,
                EngineStatus.started
            );
            if (typeof raceParams === 'object') {
                const { velocity, distance } = raceParams;
                const raceDuration: number = distance / velocity;
                this.moveToFlag(carId, carImg, raceDuration);
                const getRaceStatus: DriveStatus | undefined = await EngineAPI.drive(
                    carId,
                    this.abortController.signal
                );
                if (getRaceStatus === DriveStatus.stopped) {
                    this.engineBroken(carId);
                }
            }
        });
        return button;
    }

    private createStopEngineButton(carId: number, carImg: HTMLDivElement): HTMLButtonElement {
        const car: HTMLDivElement = carImg;
        const button = createButton('stop', classesForElements.stopButton);
        button.disabled = true;
        button.addEventListener('click', async (ev: MouseEvent) => {
            button.disabled = true;
            await EngineAPI.startStopEngine(carId, EngineStatus.stopped);
            this.stopCarAnimation(carId);
            car.style.transform = `translateX(0px)`;
            const startButton = getClosestButtonInWrapper(
                ev.target as HTMLButtonElement,
                `.${classesForElements.startButton}`
            );
            if (startButton) startButton.disabled = false;
            this.enableRaceButton(true);
        });
        return button;
    }

    private moveToFlag(carId: number, carImg: HTMLDivElement, duration: number): void {
        const car: HTMLDivElement = carImg;
        const endOfRace = document.querySelector('.car-race');
        if (endOfRace) {
            const flagPlace = endOfRace.getBoundingClientRect();
            const carPlace = carImg.getBoundingClientRect();
            const distanceToMove: number = flagPlace.right - carPlace.right;
            let start: number;
            let previousTimeStamp: number;
            let done = false;
            const step = (timestamp: number) => {
                if (start === undefined) start = timestamp;
                if (previousTimeStamp !== timestamp) {
                    const progress = (timestamp - start) / duration;
                    const currentPlace = Math.min(distanceToMove * progress, distanceToMove);
                    car.style.transform = `translateX(${currentPlace}px)`;
                    if (currentPlace === distanceToMove) done = true;
                }
                previousTimeStamp = timestamp;
                if (!done) {
                    this.carAnimations[carId] = window.requestAnimationFrame(step);
                }
            };
            this.carAnimations[carId] = requestAnimationFrame(step);
        }
    }

    private enableRaceButton(enable: boolean): void {
        const raceButton: HTMLButtonElement | null = document.querySelector(`.${classesForElements.raceButton}`);
        if (enable) this.startedCarsCounter += 1;
        else this.startedCarsCounter -= 1;
        if (raceButton) {
            raceButton.disabled = !(this.startedCarsCounter === 0);
        }
    }

    private stopCarAnimation(id: number): void {
        cancelAnimationFrame(this.carAnimations[id]);
    }

    private updateDisabledState(state?: boolean): void {
        const updateElements = document.getElementsByClassName('update');
        for (const updateElement of updateElements) {
            state === true ? updateElement.setAttribute('disabled', '') : updateElement.removeAttribute('disabled');
        }
    }

    private saveEditInputsState(): void {
        const inputElements = document.querySelectorAll('input');
        for (const inputElement of inputElements) {
            inputElement.addEventListener('input', () => {
                if (inputElement.classList.contains('update')) {
                    inputElement.type === 'text'
                        ? (Saved.selectedName = inputElement.value)
                        : (Saved.selectedColor = inputElement.value);
                } else {
                    inputElement.type === 'text'
                        ? (Saved.createdName = inputElement.value)
                        : (Saved.createdColor = inputElement.value);
                }
            });
        }
    }

    private editUpdateCarInputs(carName: string, carColor: string, carId?: number): void {
        Saved.selectedName = carName;
        Saved.selectedColor = carColor;
        if (carId) {
            Saved.selectedId = carId;
        }
    }
}
