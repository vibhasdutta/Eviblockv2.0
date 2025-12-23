import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type DeleteResult = { 'Ok': string } |
{ 'Err': string };
export interface FileRecord {
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
export type Result = { 'Ok': FileRecord } |
{ 'Err': string };
export interface VerificationLog {
  'id': bigint,
  'cid': string,
  'verifier_uid': string,
  'timestamp': bigint,
  'verifier_name': string,
  'file_id': bigint,
}
export type VerificationLogResult = { 'Ok': VerificationLog } |
{ 'Err': string };
export interface VideoVerificationRecord {
  'id': bigint,
  'uid': string,
  'video_hash': string,
  'firestore_doc_id': string,
  'document_cid': string,
  'timestamp': bigint,
}
export type VideoVerificationResult = { 'Ok': VideoVerificationRecord } |
{ 'Err': string };
export interface _SERVICE {
  'delete_document': ActorMethod<[bigint], DeleteResult>,
  'get_all_documents': ActorMethod<[], Array<FileRecord>>,
  'get_document_by_cid': ActorMethod<[string], Result>,
  'get_documents_by_uid': ActorMethod<[string], Array<FileRecord>>,
  'get_total_documents': ActorMethod<[], bigint>,
  'get_verification_logs_by_cid': ActorMethod<[string], Array<VerificationLog>>,
  'get_verification_logs_by_document_id': ActorMethod<
    [bigint],
    Array<VerificationLog>
  >,
  'get_video_by_document_cid': ActorMethod<
    [string],
    [] | [VideoVerificationRecord]
  >,
  'get_video_by_firestore_id': ActorMethod<
    [string],
    [] | [VideoVerificationRecord]
  >,
  'get_video_by_hash': ActorMethod<
    [string],
    [] | [VideoVerificationRecord]
  >,
  'get_videos_by_uid': ActorMethod<
    [string],
    Array<VideoVerificationRecord>
  >,
  'link_video_to_document': ActorMethod<
    [bigint, string],
    VideoVerificationResult
  >,
  'log_document_verification': ActorMethod<
    [string, string, string],
    VerificationLogResult
  >,
  'store_document_metadata': ActorMethod<
    [string, string, string, string, bigint, string, string, string],
    Result
  >,
  'store_video_verification': ActorMethod<
    [string, string, string],
    VideoVerificationResult
  >,
  'verify_document': ActorMethod<[string], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
