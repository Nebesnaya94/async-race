import { BASIC_URL, HTTPMethod, getURLWithQuery } from '../../helpers/common';

const ENGINE_URL = `${BASIC_URL}/engine`;

export enum EngineStatus {
    started = 'started',
    stopped = 'stopped',
    drive = 'drive',
}

export enum DriveStatus {
    success = 200,
    badRequest = 400,
    wrongOrNotStartedCar = 404,
    driveInProgress = 429,
    stopped = 500,
}

export interface IRacingParameters {
    velocity: number;
    distance: number;
}

export class EngineAPI {
    static async startStopEngine(
        id: number,
        status: Omit<EngineStatus, 'drive'>
    ): Promise<IRacingParameters | DriveStatus> {
        const queryParams = new URLSearchParams();
        queryParams.set('id', String(id));
        queryParams.set('status', String(status));

        try {
            const URL: string = getURLWithQuery(ENGINE_URL, queryParams);
            const response: Response = await fetch(URL, {
                method: HTTPMethod.PATCH,
            });

            if (response.ok) {
                return (await response.json()) as IRacingParameters;
            }

            return response.status;
        } catch (error) {
            if (error instanceof SyntaxError) {
                console.log('There was a SyntaxError in JSON:', error);
            } else {
                console.log('There was an error', error);
            }
            throw error;
        }
    }

    static async drive(id: number, abortDrive: AbortSignal): Promise<DriveStatus | undefined> {
        const queryParams = new URLSearchParams();
        queryParams.set('id', String(id));
        queryParams.set('status', EngineStatus.drive);

        try {
            const URL: string = getURLWithQuery(ENGINE_URL, queryParams);
            const response: Response = await fetch(URL, {
                method: HTTPMethod.PATCH,
                signal: abortDrive,
            });

            return response.status;
        } catch (error) {
            if (error instanceof SyntaxError) {
                console.log('There was a SyntaxError in JSON:', error);
            } else if (error instanceof DOMException) {
                console.log('Fetch request cancelled');
            } else {
                console.log('There was an error', error);
            }
            return undefined;
        }
    }
}
