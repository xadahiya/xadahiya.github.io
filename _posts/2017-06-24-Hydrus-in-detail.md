---
layout: post
category: GSoC
title: A Detailed Introduction to Hydrus
image: https://github.com/HTTP-APIs/hydrus/blob/develop/docs/wiki/images/use_case1.png?raw=true
tags: [GSoC, Hydra, Semantic Web, Hydrus, Flask]
---

Hey everyone! In my [last post](https://xadahiya.github.io/Coding-Begins/), I gave you the lowdown on who I am and what we've been up to for [GSoC](https://summerofcode.withgoogle.com/) 2017. This time, I want to dive deep into our awesome project: Hydrus!

**Hydrus** is a cool set of **Python** tools that make building Hypermedia-driven REST-APIs way easier and more efficient. It taps into the power of [Linked Data](https://en.wikipedia.org/wiki/Linked_data) to create some seriously powerful REST APIs for serving data. Plus, Hydrus uses the [Hydra(W3C)](https://www.hydra-cg.com/) standard for creating and documenting its APIs. Pretty neat, right?

Let's dive into the nitty-gritty of Hydrus!

***

Design
===================
Hydrus design revolves around three key areas: **Database design**, **Data flow**, and **Use cases**. Let's break 'em down.

Database Design
-------------
Our database design is pretty clever, taking into account all the different ways you can represent data using the triple format. We typically store four types of triples in a `Graph`:
* **`Class >> Property >> Class` [`GraphCAC`]**
* **`Resource >> Property >> Class` [`GraphIAC`]**
* **`Resource >> Property >> Resource` [`GraphIII`]**
* **`Resource >> Property >> Value` [`GraphIIT`]**

For a clear distinction between different `Value` types, we created a `Terminal` class, which holds a `value` and its `unit`. We also differentiate between `Properties` that map to `Resources` and `Terminals` versus those that map to `Classes`. We call `Properties` that map to `Classes` as `AbstractProperty` and the others as `InstanceProperty`.

Below is the schema diagram for our database design:

![DB Schema](https://github.com/HTTP-APIs/hydrus/blob/develop/docs/wiki/images/db_schema.png?raw=true "Schema")
***

Data Flow
-------------
Here's a quick peek at how data zips around in Hydrus:

**Hydra API Documentation to server endpoints**:

![API Flow](https://github.com/HTTP-APIs/hydrus/blob/develop/docs/wiki/images/hydra_dataflow.png?raw=true "API Flow")

**RDF/OWL declarations to server endpoints**:

![RDF Flow](https://github.com/HTTP-APIs/hydrus/blob/develop/docs/wiki/images/rdf_dataflow.png?raw=true "RDF Flow")

Use cases
-------------
This section breaks down Hydrus's design and shows you a real-world example. For this demo, the server uses the [Subsystems](https://ontology.projectchronos.eu/documentation/subsystems) and [Spacecraft](https://ontology.projectchronos.eu/documentation/spacecraft) vocabularies.

Here is an example of a system used to serve data using the components of Hydrus:

![Use case](https://github.com/HTTP-APIs/hydrus/blob/develop/docs/wiki/images/use_case1.png?raw=true "Use case")

**Here's a simple example to show you how this architecture works:**
* Imagine a user types in, "What's the cost of a Thermal Subsystem?"
* Our clever Middleware uses Natural Language Processing (NLP) to pull out keywords like `Thermal Subsystem` and `cost`. It then maps these to the Hydra instances and properties chilling on the server.
* The Middleware passes these instances and the original query to the client.
* The Client then crafts a request and uses the API endpoints to grab the info from the server.
* The Server, being super helpful, replies with the exact value needed.
* Finally, the Client serves up that data to the User. Easy peasy!

***

Features and Requirements
=============

Features
------------
Hydrus comes packed with these cool features:
- A client that totally gets Hydra vocabulary and can chat with any Hydra-supporting server to do basic [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) operations on data.
- A generic server that can dish out all the data and metadata (like API documentation) to a client over HTTP.
- A middleware that lets users talk to the client using plain old Natural Language, which then gets processed into machine-friendly language. (Still cooking this one up!)

Requirements
-------------
We built this system using some solid standards and tools:
- [Flask](https://flask.pocoo.org/): Our go-to Python micro-framework for handling all those server requests and responses.
- [JSON-LD](https://json-ld.org/spec/latest/json-ld/): Our preferred data format – clean and easy to work with.
- [Hydra](https://www.hydra-cg.com/): The API standard that keeps everything in line.
- [PostgreSQL](https://www.postgresql.org/): Our backend database for storing data and doing all the CRUD operations.

Oh, and there are a bunch of other Python packages Hydrus uses. You can find a full list in the [requirements.txt](https://github.com/HTTP-APIs/hydrus/blob/master/requirements.txt) file. It's a good idea to run **`pip install -r requirements.txt`** before you get started with anything else!

***

Running the Demo server
==============
**First things first, make sure you've got [docker](https://docs.docker.com/engine/installation/) and [docker-compose](https://docs.docker.com/compose/install/) installed!**

Once Docker is all set up, getting our demo server up and running is a piece of cake. Seriously, it's super easy!
### Instructions
- Clone the repository to your local machine.
- `cd` into the project directory and use `docker-compose build` to build those Docker containers.
- Fire up the containers using `docker-compose up` (and just like that, your demo server is live!).
- Now, we just need to set up and fill up the database. Connect to the container using `docker exec -it <container_name or container_id> /bin/bash` (you can find the hydrus container name with `docker ps` – it'll probably look something like `hydrus*`).
- Create the database models using `python /app/hydrus/data/db_models.py`.
- Parse and insert classes from your RDF/OWL vocabulary into the database using `python /app/hydrus/data/insert_classes.py`.
- Insert some random data generated by `hydrus.data.generator` using `python /app/hydrus/data/insert_data.py`. (Heads up: This step is only for the subsystem example. If you're using something else, you'll need to whip up your own generator to populate the database).
- Exit the docker container shell by typing `exit`.

**Your demo server should now be chilling at `127.0.0.1:8080/api`!**

**NOTE:** Docker port binding isn't playing nice with Windows right now. If you're on Windows, you can access the server at `<docker_ip>:8080/api`. Just use `docker-machine ip` to find your docker_ip.

***

Advanced Usage
=============

Setting up a Hydra server from OWL vocabulary
-------------

Setting up a new Hydra server from Hydrus is actually pretty straightforward and involves the following steps:
### 1. The first step is parsing the `HydraClasses` and their `SupportedProperties` from the OWL vocabulary.
To set up a new Hydra server you need to provide an OWL vocabulary.

`Hydrus.hydraspec.parser` can be used to generate parsed classes. Just import the OWL vocabulary in `parser.py` and run it. It will parse and convert all the OWL classes and properties into `HydraClasses` and their `SupportedProperties`.

For example -
We have the `Subsystem` OWL vocabulary defined in `Hydrus.metadata.subsystem_vocab_jsonld`.

Import this into `parser.py` using
```python
from hydrus.metadata.subsystem_vocab_jsonld import subsystem_data
```
Pass this vocab to data
```python
if __name__ == "__main__":
    # NOTE: Usage must be in the following order
        # get_all_properties() >> hydrafy_properties() >> properties
        # get_all_classes() + properties >> hydrafy_classes() >> classes
        # classes >> gen_APIDoc()

    data = subsystem_data
    # Get all the owl:ObjectProperty objects from the vocab
    owl_props = get_all_properties(data)
    ......
```
Running the `parser.py` will return `HydraClasses` and their `SupportedProperties`.<br/>
We can save this as `parsed_classes` using Output redirection. Running `python parser.py > parsed_classes` should do it!<br/>
Now we're ready to move forward. The next steps involve generating a Hydra vocabulary and various contexts.

### 2. Generating `HydraVocab` from parsed classes
`Hydrus.hydraspec.vocab_generator` can be used to generate a Hydra Vocabulary from the parsed classes. Vocab generator mainly consists `gen_vocab` function.
```python
def gen_vocab(parsed_classes, server_url, item_type, item_semantic_url):
    """Generate Hydra Vocabulary."""
    SERVER_URL = server_url
    ITEM_TYPE = item_type
    ITEM_SEMANTIC_URL = item_semantic_url

    vocab_template = {
        "@context": {
            "vocab": SERVER_URL + "/api/vocab#",
            "hydra": "https://www.w3.org/ns/hydra/core#",
            "ApiDocumentation": "hydra:ApiDocumentation",
            "property": {
......
```
We need to pass the following variables into `gen_vocab()` for generation of a Hydra Vocabulary
* `parsed_classes` - Use the classes parsed earlier from the OWL vocabulary.
* `server_url` - Url where the server is hosted.
* `item_type` - Item type can be anything depending upon what is being served by the API. For example in Subsystems example `item_type = Cots`.
* `item_sematic_url` - Semantic reference of the Item.

Vocab generator uses a Hydra Vocabulary template `vocab_template` to generate the required hydra vocabulary.

After passing all these variables, simply running the `vocab_generator.py` will return a Hydra vocabulary for the server.<br/>

```python
    print(gen_vocab(parsed_classes, "https://hydrus.com/", "Cots",
          "https://ontology.projectchronos.eu/subsystems?format=jsonld"))
```
Use Output redirection to save it, Running `python vocab_generator.py > vocab` should do it!

### 3. Generating the `Entrypoint` and `Entrypoint_context`
* #### Entrypoint Generator
`Hydrus.hydraspec.entrypoint_generator` uses an Entrypoint template to generate the required Entrypoint data.
```python
def gen_entrypoint(server_url, item_type):
    """Generate EntryPoint."""
    SERVER_URL = server_url
    ITEM_TYPE = item_type

    entrypoint_template = {
      "@context": SERVER_URL + "api/contexts/EntryPoint.jsonld",
      "@id": SERVER_URL + "api/",
      "@type": "EntryPoint",
      ITEM_TYPE.lower(): "api/%s/" % (ITEM_TYPE.lower())
    }

    return json.dumps(entrypoint_template, indent=4)
```
We can generate the data for entrypoint simply by doing something like this:

```python
print(gen_entrypoint("https://hydrus.com/", "Cots"))
```
* #### Entrypoint Context Generator
`Hydrus.hydraspec.entrypoint_context_generator` also uses a similar template to generate the entrypoint context.

```python
def gen_entrypoint_context(server_url, item_type):
    """Generate context for the EntryPoint."""
    SERVER_URL = server_url
    ITEM_TYPE = item_type

    entrypoint_context_template = {
        "@context": {
            "hydra": "https://www.w3.org/ns/hydra/core#",
            "vocab": SERVER_URL + "/api/vocab#",
            "EntryPoint": "vocab:EntryPoint",
            ITEM_TYPE.lower(): {
                "@id": "vocab:EntryPoint/"+ITEM_TYPE,
                "@type": "@id"
            }
        }
    }

    return json.dumps(entrypoint_context_template, indent=4)
```
We can generate the data for entrypoint context simply by doing something like this:
```python
print(gen_entrypoint_context("https://hydrus.com/", "Cots"))
```

Both the `Hydrus.hydraspec.entrypoint_generator` and `Hydrus.hydraspec.entrypoint_context_generator` can be used to generate `Entrypoint` and `Entrypoint_context` data.

### 4. Binding all the generated data in `Hydrus.app`
`Hydrus.app` is the main `Flask` application from where all the Contexts and endpoints are server.<br/>
The implementation of `app.py` is pretty straightforward.

Modify `Hydrus.app` to use the generated data (`vocab`, `entrypoint` and `entrypoint_context`) and change the endpoints depending upon your requirements.<br/>
Endpoints are defined in `api.add_resource` like this:

```python
# Needs to be changed manually
api.add_resource(Item, "/api/<string:type_>/<int:id_>", endpoint="cots")
```

### 5. Starting the API server
Use [these](https://github.com/HTTP-APIs/hydrus/wiki#demo) instruction to start your hydra development server locally.<br>
**NOTE**: You'll have to modify the OWL vocabulary references in these instructions too.

***

Manipulating data
----------------

We already saw how `insert` work in the Adding instance section, we will now see how the other crud operations work and what are the errors and exceptions for each of them.

### CRUD operations

There are four supported CURD operation (`insert`, `get`, `delete` and `update`). Here are examples for all four:

**GET**
```python
from hydrus.data import crud
import json

instance = crud.get(id_=1, type_="Spacecraft_Communication")     # Return the Resource/Instance with ID = 1
print(json.dumps(instance, indent=4))
# Output:
# {
#     "name": "12W communication",
#     "object": {
#         "@type": "Spacecraft_Communication",
#         "hasMass": 98,
#         "hasMonetaryValue": 6604,
#         "hasPower": -61,
#         "hasVolume": 99,
#         "maxWorkingTemperature": 63,
#         "minWorkingTemperature": -26
#     }
# }
```
**INSERT**
```python
instance = {
    "name": "12W communication",    # The name of the instance must be in "name"
    "object": {
        # The "object" key contains all the properties and their values for a given instance
        "maxWorkingTemperature": 63,    # InstanceProperty: Value, Value is automatically converted to Terminal Object

        # In case the Value for a property is another Resource, we use the following syntax
        "hasDuplicate":{
            "@id": "subsystem/34"   # The "@id" tag gives the ID of the other instance
        }

        # In case the property is an AbstractProperty, the class name should be given as Value
        "@type": "Spacecraft_Communication",     # AbstractProperty: Classname, Classname is automatically mapped to relevant RDFClass
    }
}

#Once we have defined such an `instance`, we can use the built-in CRUD operations of Hydrus to add these instances.
from hydrus.data import crud

crud.insert(object_=instance)   # This will insert 'instance' into Instance and all other information into Graph.

# Optionally, we can specify the ID of an instance if it is not already used
crud.insert(object_=instance, id_=1)    #This will insert 'instance' with ID = 1  
```

**DELETE**
```python
from hydrus.data import crud
import json

output = crud.delete(id_=1, type_="Spacecraft_Communication")     # Deletes the Resource/Instance with ID = 1
print(json.dumps(output, indent=4))
# Output:
# {
#   204: "Object with ID : 1 successfully deleted!"
# }
```
**UPDATE**
```python
from hydrus.data import crud
import json

new_object = {
    "name": "14W communication",
    "object": {
        "@type": "Spacecraft_Thermal",
        "hasMass": 8,
        "hasMonetaryValue": 6204,
        "hasPower": -10,
        "hasVolume": 200,
        "maxWorkingTemperature": 63,
        "minWorkingTemperature": -26
    }
}
output = crud.update(id_=1, object_=new_object)     # Updates the Resource/Instance with ID = 1 with new_object
print(json.dumps(output, indent=4))
# Output:
# {
#   204: "Object with ID : 1 successfully updated!"
# }
```
***

## Exceptions
The CRUD operations have a number of checks and conditions in place to ensure validity of data. Here are the exceptions that are returned for each of the operations when these conditions are violated.
NOTE: Relevant all responses are returned in JSON format

**GET**
```python

# A 401 error is returned when a given AbstractProperty: Classname pair has an invalid/undefined RDFClass
{   
    401: "The class dummyClass is not a valid/defined RDFClass"
}

# A 404 error is returned when an Instance is not found
{
    404: "Instance with ID : 2 NOT FOUND"
}

```

**INSERT**
```python
# A 400 error is returned when an instance with a given ID already exists
{
    400: "Instance with ID : 1 already exists"
}

# A 401 error is returned when a given AbstractProperty: Classname pair has an invalid/undefined RDFClass
{   
    401: "The class dummyClass is not a valid/defined RDFClass"
}

# A 402 error is returned when a given Property: Value pair has an invalid/undefined Property
{
    402: "The property dummyProp is not a valid/defined Property"
}

# A 403 error is returned when a given InstanceProperty: Instance pair has an invalid/undefined Instance ID
{   
    403: "The instance 2 is not a valid Instance"
}
```

**DELETE**
```python

# A 401 error is returned when a given AbstractProperty: Classname pair has an invalid/undefined RDFClass
{   
    401: "The class dummyClass is not a valid/defined RDFClass"
}

# A 404 error is returned when an Instance is not found
{
    404: "Instance with ID : 2 NOT FOUND"
}
```

The `update` operation is a combination of a `delete` and an `insert` operation. All exceptions for both the operation are inherited by the update operation.

***

## Setting up the server
The following section explains how the server needs to be set up to be able to serve the data we added in the previous section.

The generic server is implemented using the [Flask](https://flask.pocoo.org/) micro-framework. To get the server up and running, all you need to do is:
```python
from hydrus.app import app

IP = "127.0.0.1"
port_ = 8000
app.run(host=IP, port=port_)

# The server will be running at http://127.0.0.1:8000/
```
***
## Running tests
There are a number of tests in place to ensure that Hydrus functions properly.
For running tests related to ensuring the validity of the database run

**`python -m unittest hydrus.data.test_db`**

For running client-side tests related to the server, run

**`python -m unittest hydrus.test_app`**


## Using the client
(Under development) client not yet ready
