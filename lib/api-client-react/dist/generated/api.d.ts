import type { QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ApiError, BestXi, FantasyOverview, FixturePrediction, GetFantasyBestXiParams, GetFantasyFixturesParams, HealthStatus, PlayerProjection, SearchFantasyPlayersParams } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetFantasyOverviewUrl: () => string;
/**
 * @summary Get the live Gameweek overview
 */
export declare const getFantasyOverview: (options?: Parameters<typeof customFetch>[1]) => Promise<FantasyOverview>;
export declare const getGetFantasyOverviewQueryKey: () => readonly ["/api/5amsena/overview"];
export declare const getGetFantasyOverviewQueryOptions: <TData = Awaited<ReturnType<typeof getFantasyOverview>>, TError = ErrorType<ApiError>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFantasyOverview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFantasyOverview>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFantasyOverviewQueryResult = NonNullable<Awaited<ReturnType<typeof getFantasyOverview>>>;
export type GetFantasyOverviewQueryError = ErrorType<ApiError>;
/**
 * @summary Get the live Gameweek overview
 */
export declare function useGetFantasyOverview<TData = Awaited<ReturnType<typeof getFantasyOverview>>, TError = ErrorType<ApiError>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFantasyOverview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetFantasyFixturesUrl: (params?: GetFantasyFixturesParams) => string;
/**
 * @summary Get upcoming fixtures with transparent baseline predictions
 */
export declare const getFantasyFixtures: (params?: GetFantasyFixturesParams, options?: Parameters<typeof customFetch>[1]) => Promise<FixturePrediction[]>;
export declare const getGetFantasyFixturesQueryKey: (params?: GetFantasyFixturesParams) => readonly ["/api/5amsena/fixtures", ...GetFantasyFixturesParams[]];
export declare const getGetFantasyFixturesQueryOptions: <TData = Awaited<ReturnType<typeof getFantasyFixtures>>, TError = ErrorType<ApiError>>(params?: GetFantasyFixturesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFantasyFixtures>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFantasyFixtures>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFantasyFixturesQueryResult = NonNullable<Awaited<ReturnType<typeof getFantasyFixtures>>>;
export type GetFantasyFixturesQueryError = ErrorType<ApiError>;
/**
 * @summary Get upcoming fixtures with transparent baseline predictions
 */
export declare function useGetFantasyFixtures<TData = Awaited<ReturnType<typeof getFantasyFixtures>>, TError = ErrorType<ApiError>>(params?: GetFantasyFixturesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFantasyFixtures>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSearchFantasyPlayersUrl: (params?: SearchFantasyPlayersParams) => string;
/**
 * @summary Search live FPL players and their expected points
 */
export declare const searchFantasyPlayers: (params?: SearchFantasyPlayersParams, options?: Parameters<typeof customFetch>[1]) => Promise<PlayerProjection[]>;
export declare const getSearchFantasyPlayersQueryKey: (params?: SearchFantasyPlayersParams) => readonly ["/api/5amsena/players", ...SearchFantasyPlayersParams[]];
export declare const getSearchFantasyPlayersQueryOptions: <TData = Awaited<ReturnType<typeof searchFantasyPlayers>>, TError = ErrorType<ApiError>>(params?: SearchFantasyPlayersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchFantasyPlayers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof searchFantasyPlayers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type SearchFantasyPlayersQueryResult = NonNullable<Awaited<ReturnType<typeof searchFantasyPlayers>>>;
export type SearchFantasyPlayersQueryError = ErrorType<ApiError>;
/**
 * @summary Search live FPL players and their expected points
 */
export declare function useSearchFantasyPlayers<TData = Awaited<ReturnType<typeof searchFantasyPlayers>>, TError = ErrorType<ApiError>>(params?: SearchFantasyPlayersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchFantasyPlayers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetFantasyBestXiUrl: (params?: GetFantasyBestXiParams) => string;
/**
 * @summary Build an optimized, formation-valid Fantasy XI
 */
export declare const getFantasyBestXi: (params?: GetFantasyBestXiParams, options?: Parameters<typeof customFetch>[1]) => Promise<BestXi>;
export declare const getGetFantasyBestXiQueryKey: (params?: GetFantasyBestXiParams) => readonly ["/api/5amsena/best-xi", ...GetFantasyBestXiParams[]];
export declare const getGetFantasyBestXiQueryOptions: <TData = Awaited<ReturnType<typeof getFantasyBestXi>>, TError = ErrorType<ApiError>>(params?: GetFantasyBestXiParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFantasyBestXi>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFantasyBestXi>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFantasyBestXiQueryResult = NonNullable<Awaited<ReturnType<typeof getFantasyBestXi>>>;
export type GetFantasyBestXiQueryError = ErrorType<ApiError>;
/**
 * @summary Build an optimized, formation-valid Fantasy XI
 */
export declare function useGetFantasyBestXi<TData = Awaited<ReturnType<typeof getFantasyBestXi>>, TError = ErrorType<ApiError>>(params?: GetFantasyBestXiParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFantasyBestXi>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map