export const getClosestButtonInWrapper = (targetEl: HTMLElement, findedClass: string): HTMLButtonElement | null => {
    let button: HTMLButtonElement | null = null;

    const wrapper: HTMLDivElement | null = targetEl.closest('div');
    if (wrapper) {
        button = wrapper.querySelector(findedClass);
    }

    return button;
};

export const classesForElements: { [element: string]: string } = {
    startButton: 'btn-start',
    stopButton: 'btn-stop',
    raceButton: 'btn-race',
    resetButton: 'btn-reset',
    carsBlock: 'cars-block',
    modal: 'modal',
};
