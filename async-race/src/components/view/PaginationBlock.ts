import { createButton, createBlock } from '../../helpers/createElements';

export const paginationClassesForElements = {
    buttonsWrapper: 'pagination-wrapper',
    prevButton: 'pagination-prev',
    nextButton: 'pagination-next',
};

interface PaginationParameters {
    nextHandler: () => void;
    prevHandler: () => void;
}

export const createPaginationBlock = (params: PaginationParameters): HTMLDivElement => {
    const { nextHandler, prevHandler } = params;
    const buttonsWrapper = createBlock(paginationClassesForElements.buttonsWrapper);

    const prevPageBtn = createButton('prev', paginationClassesForElements.prevButton);
    prevPageBtn.addEventListener('click', prevHandler);

    const nextPageBtn = createButton('next', paginationClassesForElements.nextButton);
    nextPageBtn.addEventListener('click', nextHandler);

    buttonsWrapper.append(prevPageBtn, nextPageBtn);

    return buttonsWrapper;
};
