export const idlFactory = ({ IDL }: any) => {
  const DeleteResult = IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text });
  const FileRecord = IDL.Record({
    'id': IDL.Nat64,
    'cid': IDL.Text,
    'uid': IDL.Text,
    'date': IDL.Text,
    'name': IDL.Text,
    'file_size': IDL.Nat64,
    'file_type': IDL.Text,
    'timestamp': IDL.Nat64,
    'kyc_detail': IDL.Text,
    'document_type': IDL.Text,
  });
  const VerificationLog = IDL.Record({
    'id': IDL.Nat64,
    'cid': IDL.Text,
    'verifier_uid': IDL.Text,
    'timestamp': IDL.Nat64,
    'verifier_name': IDL.Text,
    'file_id': IDL.Nat64,
  });
  const VerificationLogResult = IDL.Variant({
    'Ok': VerificationLog,
    'Err': IDL.Text,
  });
  const VideoVerificationRecord = IDL.Record({
    'id': IDL.Nat64,
    'uid': IDL.Text,
    'video_hash': IDL.Text,
    'firestore_doc_id': IDL.Text,
    'document_cid': IDL.Text,
    'timestamp': IDL.Nat64,
  });
  const VideoVerificationResult = IDL.Variant({
    'Ok': VideoVerificationRecord,
    'Err': IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok': FileRecord, 'Err': IDL.Text });
  return IDL.Service({
    'delete_document': IDL.Func([IDL.Nat64], [DeleteResult], []),
    'get_all_documents': IDL.Func([], [IDL.Vec(FileRecord)], ['query']),
    'get_document_by_cid': IDL.Func([IDL.Text], [Result], ['query']),
    'get_documents_by_uid': IDL.Func([IDL.Text], [IDL.Vec(FileRecord)], ['query']),
    'get_total_documents': IDL.Func([], [IDL.Nat64], ['query']),
    'get_verification_logs_by_cid': IDL.Func(
      [IDL.Text],
      [IDL.Vec(VerificationLog)],
      ['query'],
    ),
    'get_verification_logs_by_document_id': IDL.Func(
      [IDL.Nat64],
      [IDL.Vec(VerificationLog)],
      ['query'],
    ),
    'get_video_by_document_cid': IDL.Func(
      [IDL.Text],
      [IDL.Opt(VideoVerificationRecord)],
      ['query'],
    ),
    'get_video_by_firestore_id': IDL.Func(
      [IDL.Text],
      [IDL.Opt(VideoVerificationRecord)],
      ['query'],
    ),
    'get_video_by_hash': IDL.Func(
      [IDL.Text],
      [IDL.Opt(VideoVerificationRecord)],
      ['query'],
    ),
    'get_videos_by_uid': IDL.Func(
      [IDL.Text],
      [IDL.Vec(VideoVerificationRecord)],
      ['query'],
    ),
    'link_video_to_document': IDL.Func(
      [IDL.Nat64, IDL.Text],
      [VideoVerificationResult],
      [],
    ),
    'log_document_verification': IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text],
      [VerificationLogResult],
      [],
    ),
    'store_document_metadata': IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat64, IDL.Text, IDL.Text, IDL.Text],
      [Result],
      [],
    ),
    'store_video_verification': IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text],
      [VideoVerificationResult],
      [],
    ),
    'verify_document': IDL.Func([IDL.Text], [Result], ['query']),
  });
};
export const init = () => { return []; };

export interface _SERVICE {
  'delete_document': (arg_0: bigint) => Promise<{ 'Ok': string } | { 'Err': string }>,
  'get_all_documents': () => Promise<Array<{
    'id': bigint,
    'cid': string,
    'uid': string,
    'date': string,
    'name': string,
    'file_size': bigint,
    'file_type': string,
    'timestamp': bigint,
    'kyc_detail': string,
  }>>,
  'get_document_by_cid': (arg_0: string) => Promise<{
    'Ok': {
      'id': bigint,
      'cid': string,
      'uid': string,
      'date': string,
      'name': string,
      'file_size': bigint,
      'file_type': string,
      'timestamp': bigint,
      'kyc_detail': string,
    }
  } | { 'Err': string }>,
  'get_documents_by_uid': (arg_0: string) => Promise<Array<{
    'id': bigint,
    'cid': string,
    'uid': string,
    'date': string,
    'name': string,
    'file_size': bigint,
    'file_type': string,
    'timestamp': bigint,
    'kyc_detail': string,
  }>>,
  'get_total_documents': () => Promise<bigint>,
  'get_verification_logs_by_cid': (arg_0: string) => Promise<Array<{
    'id': bigint,
    'cid': string,
    'verifier_uid': string,
    'timestamp': bigint,
    'verifier_name': string,
    'file_id': bigint,
  }>>,
  'get_verification_logs_by_document_id': (arg_0: bigint) => Promise<Array<{
    'id': bigint,
    'cid': string,
    'verifier_uid': string,
    'timestamp': bigint,
    'verifier_name': string,
    'file_id': bigint,
  }>>,
  'get_video_by_document_cid': (arg_0: string) => Promise<[] | [{
    'id': bigint,
    'uid': string,
    'video_hash': string,
    'firestore_doc_id': string,
    'document_cid': string,
    'timestamp': bigint,
  }]>,
  'get_video_by_firestore_id': (arg_0: string) => Promise<[] | [{
    'id': bigint,
    'uid': string,
    'video_hash': string,
    'firestore_doc_id': string,
    'document_cid': string,
    'timestamp': bigint,
  }]>,
  'get_video_by_hash': (arg_0: string) => Promise<[] | [{
    'id': bigint,
    'uid': string,
    'video_hash': string,
    'firestore_doc_id': string,
    'document_cid': string,
    'timestamp': bigint,
  }]>,
  'get_videos_by_uid': (arg_0: string) => Promise<Array<{
    'id': bigint,
    'uid': string,
    'video_hash': string,
    'firestore_doc_id': string,
    'document_cid': string,
    'timestamp': bigint,
  }>>,
  'link_video_to_document': (arg_0: bigint, arg_1: string) => Promise<{
    'Ok': {
      'id': bigint,
      'uid': string,
      'video_hash': string,
      'firestore_doc_id': string,
      'document_cid': string,
      'timestamp': bigint,
    }
  } | { 'Err': string }>,
  'log_document_verification': (arg_0: string, arg_1: string, arg_2: string) => Promise<{
    'Ok': {
      'id': bigint,
      'cid': string,
      'verifier_uid': string,
      'timestamp': bigint,
      'verifier_name': string,
      'file_id': bigint,
    }
  } | { 'Err': string }>,
  'store_document_metadata': (
    arg_0: string,
    arg_1: string,
    arg_2: string,
    arg_3: string,
    arg_4: bigint,
    arg_5: string,
    arg_6: string,
    arg_7: string,
  ) => Promise<{
    'Ok': {
      'id': bigint,
      'cid': string,
      'uid': string,
      'date': string,
      'name': string,
      'file_size': bigint,
      'file_type': string,
      'timestamp': bigint,
      'kyc_detail': string,
      'document_type': string,
    }
  } | { 'Err': string }>,
  'store_video_verification': (arg_0: string, arg_1: string, arg_2: string) => Promise<{
    'Ok': {
      'id': bigint,
      'uid': string,
      'video_hash': string,
      'firestore_doc_id': string,
      'document_cid': string,
      'timestamp': bigint,
    }
  } | { 'Err': string }>,
  'verify_document': (arg_0: string) => Promise<{
    'Ok': {
      'id': bigint,
      'cid': string,
      'uid': string,
      'date': string,
      'name': string,
      'file_size': bigint,
      'file_type': string,
      'timestamp': bigint,
      'kyc_detail': string,
    }
  } | { 'Err': string }>,
}

