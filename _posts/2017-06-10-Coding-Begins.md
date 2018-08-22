---
layout: post
title: GSoC Coding begins!
category: Blog
tags: [GSoC, Hydra, Semantic Web, Python Software Foundation, Flask]

---

Let me start with a basic introduction. I'm Akshay, a 21-year-old undergrad student from India.
I'm working with [Hydra](http://hydra-cg.com/) W3C Group which is a sub-org of [Python Software Foundation](https://www.python.org/psf/) with a bunch of amazing folks on Semantic web and smart APIs.

My [GSoC](https://summerofcode.withgoogle.com/) journey started with [this](https://drive.google.com/file/d/0B1mDyyLEOCHqdWJFd01KOHU5dkk/view?usp=sharing) proposal draft.

### Project Introduction

The [Hydra draft](http://www.hydra-cg.com/spec/latest/core/) describes a vocabulary to help people design RESTful APIs so that the data flow between various machines can be automated. It uses [JSON-LD](https://en.wikipedia.org/wiki/JSON-LD) as default data exchange format which is basically JSON with some extra Contexts and Vocabs to make it machine interpretable. It makes using APIs much easier.<br />
The proposed project is to create a demo Web API ​implementing the HYDRA draft, that is an​ RDF-based​ framework to demonstrate Hydra capabilities and enable a Hydra-enabled client to connect to the API's entry point and automatically find out where and how to find the needed data.


### Project Goals
- A HYDRA **server** that can serve data and metadata to a client (this layer can be split into a traditional lower level server relying on a graph database plus a "HYDRA middleware").
- A **client** that can "understand" HYDRA metadata and connect to HYDRA-enabled services, and possibly "learn and remember" about past interactions.
- An optional middleware that uses machine learning to enable conversion of user entered queries to Hydra format.

For demonstration purposes, we're using the Spacecraft and [SubSystems](https://github.com/chronos-pramantha/RDFvocab/blob/master/ld%2Bjson/SubSystems.json) vocabulary as mentioned [here](https://github.com/HTTP-APIs/hydrus/issues/2).<br />
 I think it is an interesting and fun project to work on, the idea is to design simulated spacecraft spare parts (Cubesat's COTS) and serve these parts using a REST API. In this case, the user could create his/her own parts and put them together (with physical constraints applied) to build its own spacecraft. This implementation uses the Spacecraft and SubSystems vocabulary.

![Hydrus architecture](/images/hydrus-archi.png "A basic architecture for demonstration purposes
")
*A basic architecture for demonstration purposes*

## What is Semantic Web?
The Semantic Web is a mesh of information linked up in such a way as to be easily processable by machines, on a global scale. You can think of it as being an efficient way of representing data on the World Wide Web, or as a globally linked database.<br />

The Semantic Web was thought up by Tim Berners-Lee, inventor of the WWW, URIs, HTTP, and HTML. There is a dedicated team of people at the World Wide Web Consortium (W3C) working to improve, extend and standardize the system, and many languages, publications, tools and so on have already been developed. However, Semantic Web technologies are still very much in their infancies, and although the future of the project, in general, appears to be bright, there seems to be little consensus about the likely direction and characteristics of the early Semantic Web.<br />

What's the rationale for such a system? Data that is generally hidden away in HTML files are often used in some contexts, but not in others. The problem with the majority of data on the Web that is in this format the moment is that it is difficult to use on a large scale because there is no global system for publishing data in such a way as it can be easily processed by anyone. For example, just think of information about local sports events, weather information, plane times, Major League Baseball statistics, and television guides... all of this information is presented by numerous sites, but all in HTML. The problem with that is that, in some contexts, it is difficult to use this data in the ways that one might want to do so.<br />

So the Semantic Web can be seen as a huge engineering solution... but it is more than that. We will find that as it becomes easier to publish data in a repurposable form, so more people will want to publish data, and there will be a knock-on or domino effect. We may find that a large number of Semantic Web applications can be used for a variety of different tasks, increasing the modularity of applications on the Web. But enough subjective reasoning... onto how this will be accomplished.<br />

The Semantic Web is generally built on syntaxes which use URIs to represent data, usually in triples based structures: i.e. many triples of URI data that can be held in databases, or interchanged on the World Wide Web using a set of particular syntaxes developed especially for the task. These syntaxes are called "Resource Description Framework" syntaxes.<br />

## Progress so far
During the Community Bonding period, I learned a lot about Graph Databases, SPARQL, Semantic Web and some other fancy stuff, I won't bore you about :p. <br />


For now, we are keeping things simple. Currently we're using [Flask](http://flask.pocoo.org/), [Sqlalchemy](https://www.sqlalchemy.org/) and a graph database implemented in  [PostgreSql](https://www.postgresql.org/) for our server implementation.<br />

If you want a sneak peek at the project, [here's](https://github.com/HTTP-APIs/hydrus/tree/develop) the Github repo.
