---
layout: post
category: GSoC
title: GSoC 2017 summary
tags: [GSoC, Hydra, Semantic Web, Hydrus]
image: https://1.bp.blogspot.com/-8g85F6YR8r0/WpcCNxJM_sI/AAAAAAAABbc/tpLh1if0MgYS3l1vqaEMwLPAaxC_nv81QCLcBGAs/s1600/GSoC%2B-%2BVertical%2BWide%2B-%2BGray%2BText%2B-%2BWhite%2BBG.png
permalink: /Gsoc-Summary/

---

Hi, everyone! I’m Akshay, a Google Summer of Code student working with [Hydra](https://hydra-cg.com/) (A [Python Software Foundation](https://www.python.org/psf/) sub-org). This summer, I mostly worked on 2 projects for Hydra:

- [Hydrus](https://github.com/HTTP-APIs/hydrus/)
- [A simulation to demonstrate Hydrus capabilities](https://github.com/HTTP-APIs/hydra-flock-demo/)

It was a great experience and I loved working with Hydra CG. I got to learn a lot about Python, Semantic web, Hydra, Graph databases and many other things.

I’m very grateful to my mentors, [Lorenzo](https://github.com/Mec-iS/) and [Kristian koci](https://github.com/kkoci/). They have been very responsive and helpful and it was great working with them. I would also like to thank [Chris](https://github.com/chrizandr/) (a fellow student), it was a great experience collaborating with him.

Below is the summary and links to the work I did during the last 3 months.
<hr>

GSoC Phase 1
============
During the first phase of GSoC I and [@chrizandr](https://github.com/chrizandr/) worked on [Hydrus](https://github.com/HTTP-APIs/hydrus/).


Hydrus is basically a set of **Python** based tools for easier and efficient creation of Hypermedia driven REST-APIs. Hydrus utilizes the power of [Linked Data](https://en.wikipedia.org/wiki/Linked_data) to create a powerful REST APIs to serve data.
Hydrus uses the [Hydra(W3C)](https://www.hydra-cg.com/) standard for creation and documentation of its APIs.

I wrote the following blog posts related to Hydrus and its architecture:
- [GSoC coding begins](https://xadahiya.github.io/Coding-Begins/)
- [A detailed introduction to hydrus](https://xadahiya.github.io/Hydrus-in-detail/)
<hr>

GSoC Phase 2 and 3
=============
Once we had things working with Hydrus then we started working on different projects. I was in charge of the [simulation](https://github.com/HTTP-APIs/hydra-flock-demo/) to demonstrate the capabilities of Hydrus and [Hydra Core vocabulary](https://www.hydra-cg.com/spec/latest/core/) in general. I contributed to Hydrus development whenever I had time.

The [simulation](https://github.com/HTTP-APIs/hydra-flock-demo/) simulates the movements of a flock of drones that have as objective to detect the presence of fires or abnormal heat spots in a given geographical area using an infrared sensor.

I wrote the following blog posts related to the simulation:
- [GSoC Phase 2](https://xadahiya.github.io/Phase2/)
- [Building the Simulation Gui](https://xadahiya.github.io/Simulation-gui/)
- [Finishing Up](https://xadahiya.github.io/Finishing-up/)

The simulation consists of 4 repositories:
- [Hydra Flock Demo](https://github.com/HTTP-APIs/hydra-flock-demo)
- [Hydra Flock GUI](https://github.com/HTTP-APIs/hydra-flock-gui/)
- [Hydra Flock Drone](https://github.com/HTTP-APIs/hydra-flock-drone/)
- [Hydra Flock Central Controller](https://github.com/HTTP-APIs/hydra-flock-central-controller)

The [Hydra Flock drone](https://github.com/HTTP-APIs/hydra-flock-drone) and [Hydra Flock Controller](https://github.com/HTTP-APIs/hydra-flock-central-controller) are basically instances of Hydrus with a mechanics layer on the top to simulate the behavior of Drones and Central Controller.

The [Hydra Flock GUI](https://github.com/HTTP-APIs/hydra-flock-gui) is a Javascript application that uses the data stored at the central controller and google maps to render the simulation in the browser.

<hr>

Summary of work done
===========
There were a lot of Pull Requests in different repositories. Most of them got merged but some of them were closed as we found some better alternative to do things.

1. [Pull requests created on the Hydrus repo](https://github.com/HTTP-APIs/hydrus/pulls?q=is:pr+is:closed+author:xadahiya)

2. [Pull requests created on the Hydra Flock Demo repo](https://github.com/HTTP-APIs/hydra-flock-demo/pulls?q=is:pr+is:closed+author:xadahiya)

3. [Pull requests created on the Hydra Flock GUI repo](https://github.com/HTTP-APIs/hydra-flock-gui/pulls?q=is:pr+is:closed+author:xadahiya)

4. [Pull requests created on the Hydra Flock Drone repo](https://github.com/HTTP-APIs/hydra-flock-drone/pulls?q=is:pr+is:closed+author:xadahiya)

5. [Pull requests created on the Hydra Flock Central Controller repo](https://github.com/HTTP-APIs/hydra-flock-central-controller/pulls?q=is:pr+is:closed+author:xadahiya)

It was a great experience, I'm looking forward to contributing to the Hydra community and Hydrus and Hydra community whenever I get time.
