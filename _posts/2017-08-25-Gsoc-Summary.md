---
layout: post
category: GSoC
title: GSoC 2017 summary
tags: [GSoC, Hydra, Semantic Web, Hydrus]
image: https://1.bp.blogspot.com/-8g85F6YR8r0/WpcCNxJM_sI/AAAAAAAABbc/tpLh1if0MgYS3l1vqaEMwLPAaxC_nv81QCLcBGAs/s1600/GSoC%2B-%2BVertical%2BWide%2B-%2BGray%2BText%2B-%2BWhite%2BBG.png
permalink: /Gsoc-Summary/

---

Hey everyone! Akshay here, and I was a Google Summer of Code student chilling with [Hydra](https://hydra-cg.com/) (a cool sub-org of the [Python Software Foundation](https://www.python.org/psf/)). This summer, I basically split my time between two awesome projects for Hydra:

- [Hydrus](https://github.com/HTTP-APIs/hydrus/)
- [A simulation to demonstrate Hydrus capabilities](https://github.com/HTTP-APIs/hydra-flock-demo/)

It was a seriously great experience, and I had a blast working with Hydra CG. I learned a ton about Python, the Semantic Web, Hydra, Graph databases, and a bunch of other neat stuff.

I'm super grateful to my mentors, [Lorenzo](https://github.com/Mec-iS/) and [Kristian Koci](https://github.com/kkoci/). They were incredibly responsive and helpful, and it was a pleasure working with them. A big shout-out also goes to [Chris](https://github.com/chrizandr/), a fellow student – collaborating with him was awesome!

Below is a quick rundown and links to all the cool stuff I worked on over the last three months.
<hr>

GSoC Phase 1
============
During the first phase of GSoC, [@chrizandr](https://github.com/chrizandr/) and I teamed up on [Hydrus](https://github.com/HTTP-APIs/hydrus/).

Hydrus is basically a bunch of **Python** tools designed to make creating Hypermedia-driven REST-APIs way easier and more efficient. It taps into the power of [Linked Data](https://en.wikipedia.org/wiki/Linked_data) to whip up some seriously powerful REST APIs for serving data. Hydrus also uses the [Hydra(W3C)](https://www.hydra-cg.com/) standard for building and documenting its APIs, which is pretty neat.

I wrote the following blog posts related to Hydrus and its architecture:
- [GSoC coding begins](https://xadahiya.github.io/Coding-Begins/)
- [A detailed introduction to hydrus](https://xadahiya.github.io/Hydrus-in-detail/)
<hr>

GSoC Phase 2 and 3
=============
Once we got Hydrus up and running, we started tackling different projects. I was in charge of the [simulation](https://github.com/HTTP-APIs/hydra-flock-demo/) to show off what Hydrus and the [Hydra Core vocabulary](https://www.hydra-cg.com/spec/latest/core/) could do. I also chipped in on Hydrus development whenever I had a spare moment.

This [simulation](https://github.com/HTTP-APIs/hydra-flock-demo/) basically mimics a bunch of drones flying around, trying to spot fires or weird hot spots in a given area using an infrared sensor. Pretty cool, right?

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

It was a fantastic experience, and I'm really looking forward to contributing more to the Hydra community and Hydrus whenever I can squeeze in some time!
