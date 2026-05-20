# Kubernetes (K8s) Explained: Interactive Landing Page

An interactive, single-page landing page designed to visually explain **"How Kubernetes Works"** under the hood. Built entirely with pure **HTML5, CSS3, and Vanilla JavaScript**—no heavy frameworks or external dependencies required.

👉 **Live Demo Local Link:** [http://localhost:8000](http://localhost:8000) (Ensure the local server is running)

---

## 🚀 How It Works

This landing page uses an interactive, visual-driven approach to demystify complex container orchestration concepts:

1. **The Cluster Architecture Grid**: Highlights the core components divided between the **Control Plane (Brain)** and **Worker Nodes (Muscle)**. Users can hover over components (API Server, Scheduler, etcd, etc.) to reveal their specific roles.
2. **Interactive YAML Deployments**: Inside a mock code editor, users can modify the `replicas` count (1–6) or switch the container `image` inside a simulated `deployment.yaml`. Clicking **kubectl apply** triggers a visual flow:
   - Request enters the **API Server**.
   - Current state updates in **etcd**.
   - **Controller Manager** validates desired states.
   - **Scheduler** assigns target nodes.
   - **Data packets** travel dynamically to nodes.
   - **Pods** initialize in a `Pending` state (amber pulse) and transition to `Running` (green glow).
3. **Cluster Self-Healing**: To demonstrate resilience, users can hover over any running Pod and click the red `X` (delete). The Controller Manager detects the state mismatch (`Desired: X, Actual: X-1`) and automatically spins up a replacement pod in real time.
4. **Chaos Engineering (Node Failure)**: Clicking the **Node Failure** button simulates a loss of connection to `node-02`. All pods running on that node are marked as terminating. The Scheduler immediately evicts them and reschedules replacement pods on `node-01` to maintain availability. After a brief period, `node-02` recovers.
5. **Interactive Console**: Logs all actions with colored terminal outputs, providing a step-by-step audit trail of what K8s is executing behind the scenes.

---

## 📝 Hands-On Practice

Please note that this site is **strictly a visual explainer landing page** and not a real command-line playground sandbox.

For hands-on practice on real clusters using kubectl and complete labs, we recommend:
* **[KodeKloud Playgrounds](https://kodekloud.com/)**: Offers interactive labs and cloud sandboxes (including free options) to practice real commands.

---

## 🛠️ How to Run & Build

Because this site is built using pure, vanilla web technologies, there is no build step or package installation required!

### Method 1: Python Local Server (Recommended)
Navigate to the root directory and run the built-in HTTP server:
```bash
python -m http.server 8000
```
Then open your browser and navigate to: `http://localhost:8000`

### Method 2: Node.js (npx)
If you have Node.js installed, you can serve the directory instantly:
```bash
npx http-server -p 8000
```

### Method 3: Direct File Open
You can also double-click on `index.html` to open the file directly in your browser of choice (`file:///.../index.html`). Note: Some SVG packet animations work best when run through an HTTP server (Method 1 or 2) due to viewport coordinate queries.

---

## 🤖 Built with Antigravity

This project was built through a collaborative, pair-programming session with **Antigravity**, Google DeepMind's agentic AI coding assistant.

### How Antigravity Guided the Process:
1. **Planning Phase**: Rather than diving straight into coding, Antigravity drafted an architecture and implementation plan (`implementation_plan.md`) describing the page layout, HSL color tokens, and the mathematical logic for the particle animations.
2. **No-Asset Vector Engineering**: Instead of relying on external image files that could fail to load, Antigravity built all complex icons and diagrams programmatically using inline SVG configurations. This guarantees lightning-fast loads, crystal-clear scalability, and native responsiveness.
3. **Declarative State Machine in JS**: Antigravity designed a lightweight state-management array in `app.js` to mirror K8s. It maintains active node maps and replica counts, which the DOM reconciles whenever users trigger updates or cause pod failures.
4. **Interactive Testing Loops**: Antigravity spun up local background servers and verified stylesheet layouts directly on the workspace directory structure.
