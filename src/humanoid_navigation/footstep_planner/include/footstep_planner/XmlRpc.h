#ifndef _XMLRPC_H_
#define _XMLRPC_H_

#include <string>

namespace XmlRpc {

  // Base64 encodings
  extern const char* base64_chars;
  static const int NUM_INDENTS_PER_LEVEL = 2;

  // Server or client errors
  enum XmlRpcErrorCode { 
    NO_ERROR = 0,
    PARSE_ERROR_NOT_WELL_FORMED,
    PARSE_ERROR_UNSUPPORTED_ENCODING,
    PARSE_ERROR_NO_MEMORY,
    TRANSPORT_ERROR,
    PARSE_ERROR,
    SERVER_ERROR,
    APPLICATION_ERROR,
    SYSTEM_ERROR,
    UNKNOWN_ERROR
  };

} // namespace XmlRpc

#endif // _XMLRPC_H_