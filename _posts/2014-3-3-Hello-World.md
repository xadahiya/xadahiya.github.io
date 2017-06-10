---
layout: post
title: Introduction
---

Hi everyone, I'm a 21 year old, undergrad student from India. Let me start with a basic introduction to the project.
I'm working with Hydra W3C Group which is a sub-org of Python Software Foundation.

My GSOC journey started with [this](https://drive.google.com/file/d/0B1mDyyLEOCHqdWJFd01KOHU5dkk/view?usp=sharing) proposal draft.

## Project Introduction

The [Hydra draft](http://www.hydra-cg.com/spec/latest/core/) describes a vocabulary to help people design RESTful APIs, so that the data-flow between various machines can be automated. It uses JSON-LD as default data exchange format which is basically JSON with some extra Contexts and Vocabs to make it machine interpretable. It makes using APIs much easier.<br />
The proposed project is to create a demo Web API ​implementing the HYDRA draft, that is a​n RDF-based​ framework to demonstrate Hydra capabilities and enable Hydra-enabled client to connect to the API's entrypoint and automatically find out where and how to find the needed data.


### Project Goals
- A HYDRA **server** that can serve data and metadata to a client (this layer can be split into a traditional lower level server relying on a graph database plus a "HYDRA middleware").
- A **client** that can "understand" HYDRA metadata and connect to HYDRA-enabled services, and possibly "learn and remember" about past interactions.
- A optional middleware that uses machine learning to enable conversion of user entered queries to Hydra format.

For demonstration purposes, we're using the Spacecraft and [SubSystems](https://github.com/chronos-pramantha/RDFvocab/blob/master/ld%2Bjson/SubSystems.json) vocabulary as mentioned [here](https://github.com/HTTP-APIs/hydrus/issues/2).<br />
 I think it will be a interesting and fun project to work on, the idea is about designing simulated spacecraft spare parts (Cubesat's COTS) and serve these parts using a REST API. In this case the user could create his/her own parts and put them together (with physical constraints applied) to build its own spacecraft. This implementation uses the Spacecraft and SubSystems vocabulary.

![Hydrus architecture](https://raw.githubusercontent.com/xadahiya/xadahiya.github.io/images/hydrus-archi.png "A basic architecture for demonstration purposes
")
