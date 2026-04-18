import { CreateUserData, CreateUserVariables, GetMySessionsData, RecordSessionData, RecordSessionVariables, GetGameTypesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;

export function useGetMySessions(options?: useDataConnectQueryOptions<GetMySessionsData>): UseDataConnectQueryResult<GetMySessionsData, undefined>;
export function useGetMySessions(dc: DataConnect, options?: useDataConnectQueryOptions<GetMySessionsData>): UseDataConnectQueryResult<GetMySessionsData, undefined>;

export function useRecordSession(options?: useDataConnectMutationOptions<RecordSessionData, FirebaseError, RecordSessionVariables>): UseDataConnectMutationResult<RecordSessionData, RecordSessionVariables>;
export function useRecordSession(dc: DataConnect, options?: useDataConnectMutationOptions<RecordSessionData, FirebaseError, RecordSessionVariables>): UseDataConnectMutationResult<RecordSessionData, RecordSessionVariables>;

export function useGetGameTypes(options?: useDataConnectQueryOptions<GetGameTypesData>): UseDataConnectQueryResult<GetGameTypesData, undefined>;
export function useGetGameTypes(dc: DataConnect, options?: useDataConnectQueryOptions<GetGameTypesData>): UseDataConnectQueryResult<GetGameTypesData, undefined>;
