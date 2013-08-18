{
    "name": "Module",
    "exports": {
        "Module.External": {
            "type": "Class",
            "id": 52,
            "name": "External",
            "comment": {
                "description": "The External Class",
                "params": [{
                    "type": "String",
                    "description": "The name of the external",
                    "defaultValue": null
                }],
                "returns": null
            },
            "bases": [13],
            "params": ["name"],
            "statics": [],
            "members": [{
                "type": "Property",
                "id": 43,
                "name": "name",
                "comment": {
                    "description": null,
                    "params": [{
                        "type": "String",
                        "description": "Name",
                        "defaultValue": null
                    }],
                    "returns": null
                }
            }, {
                "type": "Method",
                "id": 85,
                "name": "add",
                "comment": {
                    "description": null,
                    "params": [{
                        "type": "Integer",
                        "description": "Value A",
                        "defaultValue": null
                    }, {
                        "type": "Integer",
                        "description": "Value B",
                        "defaultValue": null
                    }],
                    "returns": {
                        "type": "Integer",
                        "description": "The result",
                        "defaultValue": null
                    }
                },
                "params": ["a", "b"],
                "supers": [13]
            }]
        }
    },
    "related": {
        "Internal": {
            "type": "Class",
            "id": 13,
            "name": "Internal",
            "comment": {
                "description": "A Internal Base Class",
                "params": [{
                    "type": "String",
                    "description": "The name of the internal",
                    "defaultValue": null
                }],
                "returns": null
            },
            "bases": [],
            "params": [],
            "statics": [{
                "type": "Property",
                "id": 19,
                "name": "uid",
                "comment": {
                    "description": null,
                    "params": [{
                        "type": "Integer",
                        "description": "Unique ID counter for instance ids",
                        "defaultValue": null
                    }],
                    "returns": null
                }
            }],
            "members": [{
                "type": "Property",
                "id": 10,
                "name": "id",
                "comment": {
                    "description": null,
                    "params": [{
                        "type": "Integer",
                        "description": "The unique ID of the class instance",
                        "defaultValue": null
                    }],
                    "returns": null
                }
            }, {
                "type": "Method",
                "id": 34,
                "name": "add",
                "comment": {
                    "description": null,
                    "params": [{
                        "type": "Integer",
                        "description": "Value A",
                        "defaultValue": null
                    }, {
                        "type": "Integer",
                        "description": "Value B",
                        "defaultValue": null
                    }],
                    "returns": {
                        "type": "Integer",
                        "description": "The result",
                        "defaultValue": null
                    }
                },
                "params": ["a", "b"],
                "supers": []
            }]
        }
    },
    "internal": {}
}
