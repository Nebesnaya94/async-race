import { ICar, CarAttributes, getURLWithQuery, HTTPMethod, BASIC_URL } from '../../helpers/common';

const GARAGE_URL = `${BASIC_URL}/garage`;

interface ICarsRequestParameters {
    page?: number;
    limit?: number;
}

export class GarageAPI {
    static async getCars(params: ICarsRequestParameters = {}): Promise<ICar[]> {
        const { page, limit } = params;

        const queryParams = new URLSearchParams();
        if (page) queryParams.set('_page', String(page));
        if (limit) queryParams.set('_limit', String(limit));

        const URL: string = getURLWithQuery(GARAGE_URL, queryParams);
        const response: Response = await fetch(URL);

        return (await response.json()) as ICar[];
    }

    static async getNumberOfCars(): Promise<number> {
        const LIMIT_ONLY_FOR_REQUEST = 1;
        const queryParams = new URLSearchParams();
        queryParams.set('_limit', String(LIMIT_ONLY_FOR_REQUEST));

        const URL: string = getURLWithQuery(GARAGE_URL, queryParams);
        const response: Response = await fetch(URL);

        return Number(response.headers.get('X-Total-Count'));
    }

    static async getCar(id: number): Promise<ICar> {
        const response: Response = await fetch(`${GARAGE_URL}/${id}`);

        return (await response.json()) as ICar;
    }

    static async createCar(params: CarAttributes): Promise<ICar> {
        const response = await fetch(GARAGE_URL, {
            method: HTTPMethod.POST,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        return (await response.json()) as ICar;
    }

    static async deleteCar(id: number): Promise<void> {
        await fetch(`${GARAGE_URL}/${id}`, {
            method: HTTPMethod.DELETE,
        });
    }

    static async updateCar(id: number, newAttributes: CarAttributes): Promise<ICar> {
        const response: Response = await fetch(`${GARAGE_URL}/${id}`, {
            method: HTTPMethod.PUT,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAttributes),
        });

        return (await response.json()) as ICar;
    }
}
