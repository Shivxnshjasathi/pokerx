const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'pokerx',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser', inputVars);
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dcOrVars, vars) {
  return executeMutation(createUserRef(dcOrVars, vars));
};

const getMySessionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMySessions');
}
getMySessionsRef.operationName = 'GetMySessions';
exports.getMySessionsRef = getMySessionsRef;

exports.getMySessions = function getMySessions(dc) {
  return executeQuery(getMySessionsRef(dc));
};

const recordSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RecordSession', inputVars);
}
recordSessionRef.operationName = 'RecordSession';
exports.recordSessionRef = recordSessionRef;

exports.recordSession = function recordSession(dcOrVars, vars) {
  return executeMutation(recordSessionRef(dcOrVars, vars));
};

const getGameTypesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetGameTypes');
}
getGameTypesRef.operationName = 'GetGameTypes';
exports.getGameTypesRef = getGameTypesRef;

exports.getGameTypes = function getGameTypes(dc) {
  return executeQuery(getGameTypesRef(dc));
};
