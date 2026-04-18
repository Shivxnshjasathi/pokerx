import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Bankroll_Key {
  id: UUIDString;
  __typename?: 'Bankroll_Key';
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  displayName: string;
  email?: string | null;
  photoUrl?: string | null;
}

export interface GameType_Key {
  id: UUIDString;
  __typename?: 'GameType_Key';
}

export interface GetGameTypesData {
  gameTypes: ({
    id: UUIDString;
    name: string;
    description?: string | null;
  } & GameType_Key)[];
}

export interface GetMySessionsData {
  sessions: ({
    id: UUIDString;
    sessionDate: DateString;
    buyIn: number;
    cashOut: number;
    gameType: {
      name: string;
    };
      location?: {
        name: string;
      };
        createdAt: TimestampString;
  } & Session_Key)[];
}

export interface Location_Key {
  id: UUIDString;
  __typename?: 'Location_Key';
}

export interface RecordSessionData {
  session_insert: Session_Key;
}

export interface RecordSessionVariables {
  sessionDate: DateString;
  gameTypeId: UUIDString;
  buyIn: number;
  cashOut: number;
  locationId?: UUIDString | null;
}

export interface Session_Key {
  id: UUIDString;
  __typename?: 'Session_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface GetMySessionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMySessionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMySessionsData, undefined>;
  operationName: string;
}
export const getMySessionsRef: GetMySessionsRef;

export function getMySessions(): QueryPromise<GetMySessionsData, undefined>;
export function getMySessions(dc: DataConnect): QueryPromise<GetMySessionsData, undefined>;

interface RecordSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RecordSessionVariables): MutationRef<RecordSessionData, RecordSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RecordSessionVariables): MutationRef<RecordSessionData, RecordSessionVariables>;
  operationName: string;
}
export const recordSessionRef: RecordSessionRef;

export function recordSession(vars: RecordSessionVariables): MutationPromise<RecordSessionData, RecordSessionVariables>;
export function recordSession(dc: DataConnect, vars: RecordSessionVariables): MutationPromise<RecordSessionData, RecordSessionVariables>;

interface GetGameTypesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetGameTypesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetGameTypesData, undefined>;
  operationName: string;
}
export const getGameTypesRef: GetGameTypesRef;

export function getGameTypes(): QueryPromise<GetGameTypesData, undefined>;
export function getGameTypes(dc: DataConnect): QueryPromise<GetGameTypesData, undefined>;

