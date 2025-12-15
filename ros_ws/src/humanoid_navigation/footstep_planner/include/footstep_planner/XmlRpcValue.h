#ifndef XMLRPC_VALUE_H
#define XMLRPC_VALUE_H

#include <rclcpp/parameter.hpp>
#include <map>
#include <vector>
#include <string>

namespace XmlRpc {

class XmlRpcException : public std::runtime_error {
public:
  XmlRpcException(const std::string& message) : std::runtime_error(message) {}
};

class XmlRpcValue {
public:
  enum Type {
    TypeInvalid,
    TypeBoolean,
    TypeInt,
    TypeDouble,
    TypeString,
    TypeDateTime,
    TypeBase64,
    TypeArray,
    TypeStruct
  };

  // Default constructor
  XmlRpcValue() : _type(TypeInvalid) {}
  
  // Constructor for basic types
  XmlRpcValue(bool value) : _type(TypeBoolean) { _value.asBool = value; }
  XmlRpcValue(int value) : _type(TypeInt) { _value.asInt = value; }
  XmlRpcValue(double value) : _type(TypeDouble) { _value.asDouble = value; }
  XmlRpcValue(const std::string& value) : _type(TypeString) {
    _value.asString = new std::string(value);
  }
  
  // Copy constructor
  XmlRpcValue(const XmlRpcValue& rhs) {
    *this = rhs;  // Use assignment operator
  }
  
  // Destructor
  ~XmlRpcValue() {
    invalidate();
  }
  
  // Assignment operator
  XmlRpcValue& operator=(const XmlRpcValue& rhs) {
    if (this != &rhs) {
      invalidate();
      _type = rhs._type;
      switch (_type) {
        case TypeBoolean: _value.asBool = rhs._value.asBool; break;
        case TypeInt: _value.asInt = rhs._value.asInt; break;
        case TypeDouble: _value.asDouble = rhs._value.asDouble; break;
        case TypeString: _value.asString = new std::string(*rhs._value.asString); break;
        case TypeArray: _value.asArray = new ValueArray(*rhs._value.asArray); break;
        case TypeStruct: _value.asStruct = new ValueStruct(*rhs._value.asStruct); break;
        default: break;
      }
    }
    return *this;
  }
  
  // Type checking
  Type getType() const { return _type; }
  bool valid() const { return _type != TypeInvalid; }

  // Conversion operators
  operator bool&() { 
    assertTypeOrInvalid(TypeBoolean);
    return _value.asBool;
  }
  
  operator int&() { 
    assertTypeOrInvalid(TypeInt);
    return _value.asInt;
  }
  
  operator double&() { 
    assertTypeOrInvalid(TypeDouble);
    return _value.asDouble;
  }
  
  operator std::string&() { 
    assertTypeOrInvalid(TypeString);
    return *_value.asString;
  }

  // Access for struct types
  XmlRpcValue& operator[](const std::string& key) {
    assertTypeOrInvalid(TypeStruct);
    return (*_value.asStruct)[key];
  }
  
  // Access for array types
  XmlRpcValue& operator[](int index) {
    assertTypeOrInvalid(TypeArray);
    if (index >= 0 && index < int(_value.asArray->size()))
      return (*_value.asArray)[index];
    throw XmlRpcException("Array index out of bounds");
  }
  
  // Size for arrays and structs
  int size() const {
    if (_type == TypeArray)
      return int(_value.asArray->size());
    else if (_type == TypeStruct)
      return int(_value.asStruct->size());
    else
      throw XmlRpcException("Size not applicable to this type");
  }
  
  // Check if a struct has a member
  bool hasMember(const std::string& name) const {
    assertType(TypeStruct);
    return _value.asStruct->find(name) != _value.asStruct->end();
  }

private:
  // Internal data types
  typedef std::vector<XmlRpcValue> ValueArray;
  typedef std::map<std::string, XmlRpcValue> ValueStruct;
  
  Type _type;
  
  // Union to store the value
  union Value {
    bool asBool;
    int asInt;
    double asDouble;
    std::string* asString;
    ValueArray* asArray;
    ValueStruct* asStruct;
  } _value;
  
  // Helper methods
  void invalidate() {
    switch (_type) {
      case TypeString: delete _value.asString; break;
      case TypeArray: delete _value.asArray; break;
      case TypeStruct: delete _value.asStruct; break;
      default: break;
    }
    _type = TypeInvalid;
  }
  
  void assertType(Type t) const {
    if (_type != t)
      throw XmlRpcException("Type mismatch");
  }
  
  void assertTypeOrInvalid(Type t) {
    if (_type == TypeInvalid) {
      _type = t;
      switch (t) {
        case TypeString: _value.asString = new std::string(); break;
        case TypeArray: _value.asArray = new ValueArray(); break;
        case TypeStruct: _value.asStruct = new ValueStruct(); break;
        default: break;
      }
    } else {
      assertType(t);
    }
  }
};

} // namespace XmlRpc

#endif // XMLRPC_VALUE_H