import { createBlock } from '../../helpers/createElements';

export class WinnerModal {
    #modalEl?: HTMLDivElement;

    #inscEl?: HTMLParagraphElement;

    public render(): HTMLDivElement {
        const modalWrapperEl: HTMLDivElement = createBlock('modal');
        const contentEl: HTMLDivElement = createBlock('modal-content');

        const inscriptionEl: HTMLDivElement = document.createElement('p');
        inscriptionEl.classList.add('modal__inscription');
        this.#inscEl = inscriptionEl;

        modalWrapperEl.append(contentEl);
        contentEl.append(inscriptionEl);

        modalWrapperEl.style.display = 'none';
        this.#modalEl = modalWrapperEl;

        return modalWrapperEl;
    }

    public showModalWithText(text: string): void {
        if (this.#modalEl) {
            if (this.#inscEl) this.#inscEl.textContent = text;
            this.#modalEl.style.display = 'flex';
        }
    }

    public hideModal(): void {
        if (this.#modalEl) {
            this.#modalEl.style.display = 'none';
        }
    }
}
