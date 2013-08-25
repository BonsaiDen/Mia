{
    "name": "Module",
    "exports": {
        "Module.External": {
            "type": "Class",
            "id": 63,
            "name": "External",
            "comment": {
                "description": "The External Class.",
                "params": [{
                    "type": "String",
                    "description": "The name of the external."
                }]
            },
            "bases": [13],
            "params": ["name"],
            "statics": [{
                "type": "Function",
                "id": 71,
                "name": "classMethod",
                "comment": {
                    "returns": {
                        "type": "Any",
                        "description": "Returns the passed in value."
                    },
                    "params": [{
                        "type": "Any",
                        "description": "Any value."
                    }]
                },
                "params": ["a"]
            }, {
                "type": "Factory",
                "id": 122,
                "name": "CreateExternal",
                "comment": {
                    "description": "A Static Factory.",
                    "returns": {
                        "type": "External"
                    }
                },
                "params": []
            }],
            "members": [{
                "type": "Property",
                "id": 54,
                "name": "name",
                "comment": {
                    "params": [{
                        "type": "String",
                        "description": "Name."
                    }]
                }
            }, {
                "type": "Method",
                "id": 106,
                "name": "add",
                "comment": {
                    "returns": {
                        "type": "Integer",
                        "description": "The result."
                    },
                    "params": [{
                        "type": "Integer",
                        "description": "Value A."
                    }, {
                        "type": "Integer",
                        "description": "Value B."
                    }]
                },
                "params": ["a", "b"],
                "supers": [13]
            }, {
                "type": "Method",
                "id": 134,
                "name": "methodAlias",
                "comment": {
                    "description": "Aliased method with multiple names.",
                    "returns": {
                        "type": "Null"
                    }
                },
                "params": [],
                "supers": []
            }, {
                "type": "Method",
                "id": 134,
                "name": "method",
                "comment": {
                    "description": "Aliased method with multiple names.",
                    "returns": {
                        "type": "Null"
                    }
                },
                "params": [],
                "supers": []
            }]
        }
    },
    "related": {
        "Internal": {
            "type": "Class",
            "id": 13,
            "name": "Internal",
            "comment": {
                "description": "A Internal Base Class.",
                "params": [{
                    "type": "String",
                    "description": "The name of the internal."
                }]
            },
            "bases": [],
            "params": [],
            "statics": [{
                "type": "Property",
                "id": 19,
                "name": "uid",
                "comment": {
                    "params": [{
                        "type": "Integer",
                        "description": "Unique ID counter for instance ids."
                    }]
                }
            }],
            "members": [{
                "type": "Property",
                "id": 10,
                "name": "id",
                "comment": {
                    "params": [{
                        "type": "Integer",
                        "description": "The unique ID of the class instance."
                    }]
                }
            }, {
                "type": "Method",
                "id": 34,
                "name": "add",
                "comment": {
                    "returns": {
                        "type": "Integer",
                        "description": "The result."
                    },
                    "params": [{
                        "type": "Integer",
                        "description": "Value A."
                    }, {
                        "type": "Integer",
                        "description": "Value B."
                    }]
                },
                "params": ["a", "b"],
                "supers": []
            }, {
                "type": "Method",
                "id": 45,
                "name": "hidden",
                "comment": {
                    "description": "A private method.",
                    "returns": {
                        "type": "Integer"
                    },
                    "visibility": "private"
                },
                "params": [],
                "supers": []
            }]
        }
    },
    "internal": {}
}
