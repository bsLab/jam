# jam
JavaScript Agent Machine Software Framework - Mobile Agents for the Web and IoT

---

**Starting from 10/2023, any updates are only availble here**:

http://git.edu-9.de/sbosse/jam

---

**Since 10/2023 github enforces a two-factor or multi-factor authentication, which is neither required in principle nor comfortable in daily use of a code repository. This was introduced for economical reasons (Microsoft as github owner sells 2FA/MFA software solutions and want to remove non-profit, i.e., low-impact, repositories), higher user control, and not for security primarily, and leads to an unnecessary collection of sensitive personal data and linking of services that should be rejected by users and developers.**

<a href="https://www.battleforlibraries.com/">Fight For the Future</a>
---

The JavaScript Agent Machine (JAM) is a multi-agent system framework. The agent processing platform satisfies the following constraints from a software design perspective:

1. Portability with low hardware and operating system dependencies;
2. Possibility for deployment on low-resource platforms;
3. Embeddable in any software application, including Web pages;
4. Scalability with respect to agent number and computational agent complexity.

JAM is entirely programmed in JavaScript and satisfies the first and third constraints immediately. The satisfaction of the second and fourth constraints depends on the underlying JavaScript Virtual Machine (JVM). But even the node.js JVM can be deployed on embedded and mobile systems like smartphones (typically requiring at least 1000 MIPS CPU power and 50 MB main memory for satisfying responsiveness and scalability).


## The Software

1. The JAM shell `jamsh` can be used from the command line (requiring node.js, jx, or pl3 JavScript VM)
2. The JAM Web laboratory `jamweb.html` can be used in any browser
3. The JAM library `jamlib.js` and `jamlib.browser.js` can be embedded in any node.js or Web Browser program.
4. The Simulation Environment for JAM `sejam2` is a standalone application using nw.js or can be run in a Web browser.

The software can be found in the *dist* folder.

**New Book**

[Crowdsourcing and Simulation with Mobile Agents and the JavaScript Agent Machine](https://leanpub.com/jamabx)
