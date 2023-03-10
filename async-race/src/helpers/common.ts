import { OrderResult, SortResult } from '../components/CarsAPI/winnersRepository';

export const BASIC_URL = 'http://127.0.0.1:3000';

export enum HTTPMethod {
    GET = 'GET',
    POST = 'POST',
    DELETE = 'DELETE',
    PUT = 'PUT',
    PATCH = 'PATCH',
}

export interface ICar {
    name: string;
    color: string;
    id: number;
}

export interface IWinnerInfo {
    carId: number;
    raceDuration: number;
}

export type CarAttributes = Omit<ICar, 'id'>;

export const getURLWithQuery = (baseURL: string, queryParameters: URLSearchParams): string => {
    const queryString = queryParameters.toString();
    const URL = queryString.length === 0 ? baseURL : `${baseURL}?${queryString}`;

    return URL;
};

export const enum PageIds {
    ErrorPage = 'error',
    GaragePage = 'garage',
    WinnersPage = 'winners',
}

interface ISaved {
    selectedId: number;
    selectedName: string;
    selectedColor: string;
    createdName: string;
    createdColor: string;
    garagePageNumber: number;
    winnersPageNumber: number;
    currentSort?: SortResult;
    currentOrder?: OrderResult;
}

export const Saved: ISaved = {
    selectedId: -1,
    selectedName: '',
    selectedColor: '#FFFBF3',
    createdName: '',
    createdColor: '#9424C8',
    garagePageNumber: 1,
    winnersPageNumber: 1,
};
