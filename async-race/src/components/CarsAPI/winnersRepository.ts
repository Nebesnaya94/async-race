import { BASIC_URL, HTTPMethod, getURLWithQuery } from '../../helpers/common';

const WINNERS_URL = `${BASIC_URL}/winners`;

export enum SortResult {
    id = 'id',
    wins = 'wins',
    time = 'time',
}

export enum OrderResult {
    asc = 'ASC',
    desc = 'DESC',
}

interface IWinnersRequest {
    page?: number;
    limit?: number;
    sort?: SortResult;
    order?: OrderResult;
}

export interface IWinner {
    id: number;
    wins: number;
    time: number;
}

export interface IWinnerInfo {
    carId: number;
    raceDuration: number;
}

export enum WinnerRequestStatus {
    ok = 200,
    notFound = 404,
    duplicateID = 500,
}

export class WinnersAPI {
    static async getWinners(winnersRequest: IWinnersRequest): Promise<IWinner[]> {
        const { page, limit, sort, order } = winnersRequest;

        const queryParams = new URLSearchParams();
        if (page) queryParams.set('_page', String(page));
        if (limit) queryParams.set('_limit', String(limit));
        if (sort) queryParams.set('_sort', sort);
        if (order) queryParams.set('_order', order);

        const URL: string = getURLWithQuery(WINNERS_URL, queryParams);
        const response: Response = await fetch(URL);

        return (await response.json()) as IWinner[];
    }

    static async getWinner(id: number): Promise<IWinner> {
        const response: Response = await fetch(`${WINNERS_URL}/${id}`);

        return (await response.json()) as IWinner;
    }

    static async createWinner(winnerParams: IWinner): Promise<IWinner | WinnerRequestStatus> {
        const response = await fetch(WINNERS_URL, {
            method: HTTPMethod.POST,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(winnerParams),
        });

        if (response.ok) return (await response.json()) as IWinner;

        return response.status;
    }

    static async deleteWinner(id: number): Promise<WinnerRequestStatus> {
        const response: Response = await fetch(`${WINNERS_URL}/${id}`, {
            method: HTTPMethod.DELETE,
        });

        return response.status;
    }

    static async updateWinner(id: number, winnerParams: Omit<IWinner, 'id'>): Promise<IWinner | WinnerRequestStatus> {
        const response = await fetch(`${WINNERS_URL}/${id}`, {
            method: HTTPMethod.PUT,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(winnerParams),
        });

        if (response.ok) return (await response.json()) as IWinner;

        return response.status;
    }

    static async getNumberOfWinners(): Promise<number> {
        const LIMIT_ONLY_FOR_REQUEST = 1;
        const queryParams = new URLSearchParams();
        queryParams.set('_limit', String(LIMIT_ONLY_FOR_REQUEST));

        const URL: string = getURLWithQuery(WINNERS_URL, queryParams);
        const response: Response = await fetch(URL);

        return Number(response.headers.get('X-Total-Count'));
    }
}
