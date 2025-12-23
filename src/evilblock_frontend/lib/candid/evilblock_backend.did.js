export const idlFactory = ({ IDL }) => {
  const DeleteResult = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const FileRecord = IDL.Record({
    'id' : IDL.Nat64,
    'cid' : IDL.Text,
    'uid' : IDL.Text,
    'date' : IDL.Text,
    'name' : IDL.Text,
    'file_size' : IDL.Nat64,
    'file_type' : IDL.Text,
    'timestamp' : IDL.Nat64,
  });
  const VerificationLog = IDL.Record({
    'id' : IDL.Nat64,
    'cid' : IDL.Text,
    'verifier_uid' : IDL.Text,
    'timestamp' : IDL.Nat64,
    'verifier_name' : IDL.Text,
    'file_id' : IDL.Nat64,
  });
  const VerificationLogResult = IDL.Variant({
    'Ok' : VerificationLog,
    'Err' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : FileRecord, 'Err' : IDL.Text });
  return IDL.Service({
    'delete_file_record' : IDL.Func([IDL.Nat64], [DeleteResult], []),
    'get_all_records' : IDL.Func([], [IDL.Vec(FileRecord)], ['query']),
    'get_file_by_id' : IDL.Func([IDL.Nat64], [IDL.Opt(FileRecord)], ['query']),
    'get_records' : IDL.Func([IDL.Text], [IDL.Vec(FileRecord)], ['query']),
    'get_total_files' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_verification_logs' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(VerificationLog)],
        ['query'],
      ),
    'get_verification_logs_by_file_id' : IDL.Func(
        [IDL.Nat64],
        [IDL.Vec(VerificationLog)],
        ['query'],
      ),
    'log_verification' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [VerificationLogResult],
        [],
      ),
    'store_file_metadata' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat64, IDL.Text],
        [Result],
        [],
      ),
    'verify_file' : IDL.Func([IDL.Text], [Result], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
