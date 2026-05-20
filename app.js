/* ==========================================================================
   KUBERNETES LANDING PAGE - MODERN INTERACTIVE LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initConceptTabs();
  initK8sSimulator();
});

/* ==========================================================================
   NAVIGATION & UI INTERACTIVITY
   ========================================================================== */

function initNavbar() {
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky Navbar background opacity on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.background = 'rgba(3, 7, 18, 0.95)';
      header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    } else {
      header.style.background = 'rgba(3, 7, 18, 0.75)';
      header.style.boxShadow = 'none';
    }

    // Scroll Spy active navigation state
    let fromTop = window.scrollY + 100;
    navLinks.forEach(link => {
      let section = document.querySelector(link.getAttribute('href'));
      if (
        section &&
        section.offsetTop <= fromTop &&
        section.offsetTop + section.offsetHeight > fromTop
      ) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  });

  // Mobile Menu Toggle
  menuToggle.addEventListener('click', () => {
    const isExpanded = navMenu.style.display === 'flex';
    if (isExpanded) {
      navMenu.style.display = 'none';
    } else {
      navMenu.style.display = 'flex';
      navMenu.style.flexDirection = 'column';
      navMenu.style.position = 'absolute';
      navMenu.style.top = '4.5rem';
      navMenu.style.left = '0';
      navMenu.style.width = '100%';
      navMenu.style.background = 'rgba(3, 7, 18, 0.95)';
      navMenu.style.borderBottom = '1px solid var(--glass-border)';
      navMenu.style.padding = '1.5rem 2rem';
      navMenu.style.gap = '1.25rem';
    }
  });

  // Close mobile menu on nav link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navMenu.style.display = 'none';
      }
    });
  });
}

/* ==========================================================================
   CONCEPT TABS GLOSSARY
   ========================================================================== */

function initConceptTabs() {
  const tabs = document.querySelectorAll('.concept-tab');
  const contents = document.querySelectorAll('.concept-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update active tab button
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update visible tab content
      contents.forEach(content => {
        if (content.id === `tab-content-${targetTab}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

/* ==========================================================================
   KUBERNETES DEPLOYMENT SIMULATOR
   ========================================================================== */

function initK8sSimulator() {
  // Elements
  const replicaInput = document.getElementById('replicaInput');
  const imageSelect = document.getElementById('imageSelect');
  const deployBtn = document.getElementById('deployBtn');
  const chaosBtn = document.getElementById('chaosBtn');
  const scaleResetBtn = document.getElementById('scaleResetBtn');
  
  const cpApiServer = document.getElementById('cp-apiserver');
  const cpEtcd = document.getElementById('cp-etcd');
  const cpScheduler = document.getElementById('cp-scheduler');
  const cpController = document.getElementById('cp-controller');
  
  const node1Pods = document.getElementById('node-1-pods');
  const node2Pods = document.getElementById('node-2-pods');
  const node1Status = document.getElementById('node-1-status');
  const node2Status = document.getElementById('node-2-status');
  const node1El = document.getElementById('node-1');
  const node2El = document.getElementById('node-2');
  
  const flowContainer = document.getElementById('flowContainer');
  const simConsole = document.getElementById('simConsole');

  // Simulation State
  let currentReplicas = 0;
  let currentImage = '';
  let podsList = []; // Array of pod objects: { id, name, node, status, image }
  let node2Healthy = true;
  let isSimulating = false;

  // Initial setup: start with 3 running pods using Nginx image
  resetCluster(3, 'nginx:alpine');

  // Event Listeners
  deployBtn.addEventListener('click', () => {
    if (isSimulating) return;
    const replicas = parseInt(replicaInput.value, 10);
    const image = imageSelect.value;
    
    // Bounds check
    if (isNaN(replicas) || replicas < 1 || replicas > 6) {
      logConsole('Deployment aborted: Replicas must be between 1 and 6.', 'error');
      return;
    }

    reconcileCluster(replicas, image);
  });

  chaosBtn.addEventListener('click', () => {
    if (isSimulating) {
      logConsole('Wait for current deployment reconciliation to finish before inducing chaos.', 'warning');
      return;
    }
    triggerNodeFailure();
  });

  scaleResetBtn.addEventListener('click', () => {
    if (isSimulating) return;
    resetCluster(3, 'nginx:alpine');
    replicaInput.value = 3;
    imageSelect.value = 'nginx:alpine';
  });

  // Watch for input changes to log a hint
  replicaInput.addEventListener('change', () => {
    const val = parseInt(replicaInput.value, 10);
    if (val !== currentReplicas) {
      logConsole(`YAML configuration drift: replicas set to ${val}. Click "kubectl apply" to sync.`, 'warning');
    }
  });

  imageSelect.addEventListener('change', () => {
    const img = imageSelect.value;
    if (img !== currentImage) {
      logConsole(`YAML configuration drift: image set to ${img}. Click "kubectl apply" to sync.`, 'warning');
    }
  });

  /* Helper: Add logs to the simulation terminal */
  function logConsole(message, type = 'system') {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    const line = document.createElement('div');
    line.className = 'console-line';
    line.innerHTML = `
      <span class="console-timestamp">[${timeStr}]</span>
      <span class="console-text ${type}">${message}</span>
    `;
    simConsole.appendChild(line);
    simConsole.scrollTop = simConsole.scrollHeight;
  }

  /* Clear visual pods layout */
  function clearPodsVisuals() {
    node1Pods.innerHTML = '';
    node2Pods.innerHTML = '';
  }

  /* Helper: Random string for Pod suffix */
  function randomString(length) {
    const chars = 'abcdef0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /* Initialize cluster to basic state */
  function resetCluster(count, image) {
    podsList = [];
    currentReplicas = count;
    currentImage = image;
    node2Healthy = true;
    isSimulating = false;
    
    node1Status.style.background = 'hsl(var(--accent-green))';
    node1Status.style.boxShadow = '0 0 6px hsl(var(--accent-green))';
    node2Status.style.background = 'hsl(var(--accent-green))';
    node2Status.style.boxShadow = '0 0 6px hsl(var(--accent-green))';
    node2El.style.opacity = '1';
    node2El.style.borderColor = 'var(--glass-border)';

    clearPodsVisuals();

    // Generate and render initial pods (running state immediately)
    for (let i = 0; i < count; i++) {
      const nodeNum = (i % 2 === 0) ? 1 : 2;
      const podId = `pod-${randomString(5)}`;
      const podName = `web-app-${randomString(5)}`;
      
      const pod = {
        id: podId,
        name: podName,
        node: nodeNum,
        status: 'running',
        image: image
      };
      
      podsList.push(pod);
      renderPod(pod);
    }

    simConsole.innerHTML = ''; // Clear previous logs
    logConsole('Cluster initialized. Desired State reconciled (Replicas: ' + count + ').', 'success');
  }

  /* Render a pod element inside its target node */
  function renderPod(pod) {
    const parentContainer = pod.node === 1 ? node1Pods : node2Pods;
    
    // Create elements
    const podEl = document.createElement('div');
    podEl.className = `pod-unit ${pod.status}`;
    podEl.id = pod.id;
    podEl.title = `Image: ${pod.image}\nStatus: ${pod.status.toUpperCase()}`;
    
    // Pod SVG layout
    podEl.innerHTML = `
      <svg class="pod-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="9" cy="9" r="2"/>
        <circle cx="15" cy="15" r="2"/>
      </svg>
      <span class="pod-name">${pod.name}</span>
      <button class="pod-kill-btn" title="Delete Pod (Simulate crash)">&times;</button>
    `;

    // Hook delete click handler
    const killBtn = podEl.querySelector('.pod-kill-btn');
    killBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isSimulating) {
        logConsole('Cannot kill pods while deployment is resolving.', 'warning');
        return;
      }
      killPod(pod.id);
    });

    parentContainer.appendChild(podEl);
  }

  /* Delete a single pod (causes reconciliation loop trigger) */
  function killPod(podId) {
    const idx = podsList.findIndex(p => p.id === podId);
    if (idx === -1) return;

    const pod = podsList[idx];
    logConsole(`Pod ${pod.name} was deleted/crashed.`, 'error');

    // Update pod status to terminating in DOM
    const podEl = document.getElementById(podId);
    if (podEl) {
      podEl.className = 'pod-unit terminating';
      
      // Remove from visual layout and state list after delay
      setTimeout(() => {
        podEl.remove();
        podsList.splice(idx, 1);
        
        // Trigger self-healing reconciliation
        triggerSelfHealing();
      }, 1000);
    }
  }

  /* Self-healing flow when pods list drops below desired */
  function triggerSelfHealing() {
    logConsole('Controller Manager: Desired replicas: ' + currentReplicas + ', actual replicas: ' + podsList.length, 'warning');
    logConsole('Controller Manager: Mismatch detected. Activating Reconciliation Loop.', 'warning');
    
    isSimulating = true;
    
    // Simulate control plane processing
    setTimeout(() => {
      cpController.classList.add('active');
      logConsole('Controller Manager: Creating request for 1 new Pod replacement.', 'system');
      
      setTimeout(() => {
        cpController.classList.remove('active');
        cpApiServer.classList.add('active');
        logConsole('API Server: Logged replacement pod request in etcd database.', 'system');
        
        setTimeout(() => {
          cpApiServer.classList.remove('active');
          cpScheduler.classList.add('active');
          logConsole('Scheduler: Selecting best worker node based on cluster capacity.', 'system');
          
          // Select healthiest node (evenly distribute if both healthy)
          let targetNode = 1;
          if (node2Healthy) {
            const countN1 = podsList.filter(p => p.node === 1).length;
            const countN2 = podsList.filter(p => p.node === 2).length;
            targetNode = countN1 <= countN2 ? 1 : 2;
          }

          setTimeout(() => {
            cpScheduler.classList.remove('active');
            
            // Animate packet to target node
            animateDataPacket(cpScheduler, targetNode === 1 ? node1El : node2El, () => {
              // Node receives instruction
              logConsole(`Kubelet on node-0${targetNode}: Received launch command. Creating Pod container.`, 'system');
              
              const podId = `pod-${randomString(5)}`;
              const podName = `web-app-${randomString(5)}`;
              const newPod = {
                id: podId,
                name: podName,
                node: targetNode,
                status: 'pending',
                image: currentImage
              };
              
              podsList.push(newPod);
              renderPod(newPod);
              
              // Shift pending to running
              setTimeout(() => {
                const podElement = document.getElementById(podId);
                if (podElement) {
                  podElement.classList.remove('pending');
                  podElement.classList.add('running');
                  newPod.status = 'running';
                  logConsole(`Pod ${podName} successfully started and marked RUNNING.`, 'success');
                }
                isSimulating = false;
              }, 1500);
            });

          }, 800);
        }, 800);
      }, 800);
    }, 500);
  }

  /* Reconcile desired state (from YAML config) */
  function reconcileCluster(targetCount, targetImage) {
    isSimulating = true;
    
    // Highlight UI inputs during deployment
    deployBtn.disabled = true;
    deployBtn.innerText = 'Reconciling...';
    
    logConsole(`Executing: kubectl apply -f deployment.yaml`, 'success');
    
    // Step 1: API Server
    cpApiServer.classList.add('active');
    logConsole(`API Server: Received state declaration. Desired replicas: ${targetCount}, Image: ${targetImage}`, 'system');
    
    setTimeout(() => {
      // Step 2: etcd
      cpApiServer.classList.remove('active');
      cpEtcd.classList.add('active');
      logConsole('etcd: Persisting configuration state update.', 'system');
      
      setTimeout(() => {
        // Step 3: Controller Manager
        cpEtcd.classList.remove('active');
        cpController.classList.add('active');
        const activeCount = podsList.filter(p => p.status === 'running').length;
        logConsole(`Controller Manager: Comparing current state (${activeCount} Pods) with desired state (${targetCount} Pods).`, 'system');
        
        setTimeout(() => {
          cpController.classList.remove('active');
          
          // Image rolling update check
          const imageDiffers = targetImage !== currentImage;
          
          if (imageDiffers) {
            logConsole(`Controller Manager: Image mismatch detected. Starting rolling replacement of all Pods to ${targetImage}...`, 'warning');
            rollingUpdate(targetCount, targetImage);
          } else if (targetCount > activeCount) {
            logConsole(`Controller Manager: Desired replicas (${targetCount}) > Current (${activeCount}). Triggering Scheduler for scaling up...`, 'warning');
            scaleUp(targetCount - activeCount, targetImage);
          } else if (targetCount < activeCount) {
            logConsole(`Controller Manager: Desired replicas (${targetCount}) < Current (${activeCount}). Triggering scale down...`, 'warning');
            scaleDown(activeCount - targetCount);
          } else {
            logConsole('Controller Manager: Desired and actual states are in sync. No actions needed.', 'success');
            finishSim();
          }

        }, 800);
      }, 800);
    }, 800);
  }

  /* Scale Up: Add new pods */
  function scaleUp(countToAdd, image, onComplete = null) {
    cpScheduler.classList.add('active');
    logConsole(`Scheduler: Assigning ${countToAdd} new Pod(s) to suitable Nodes...`, 'system');

    setTimeout(() => {
      cpScheduler.classList.remove('active');
      
      let packetsFinished = 0;
      
      for (let i = 0; i < countToAdd; i++) {
        // Schedule to healthiest / emptiest node
        let targetNode = 1;
        if (node2Healthy) {
          const countN1 = podsList.filter(p => p.node === 1).length;
          const countN2 = podsList.filter(p => p.node === 2).length;
          targetNode = countN1 <= countN2 ? 1 : 2;
        }

        // Animate packet flow
        animateDataPacket(cpScheduler, targetNode === 1 ? node1El : node2El, () => {
          logConsole(`Kubelet on node-0${targetNode}: Launching replacement / scaled pod.`, 'system');
          
          const podId = `pod-${randomString(5)}`;
          const podName = `web-app-${randomString(5)}`;
          const newPod = {
            id: podId,
            name: podName,
            node: targetNode,
            status: 'pending',
            image: image
          };
          
          podsList.push(newPod);
          renderPod(newPod);

          // Shift pending to running after simulation delay
          setTimeout(() => {
            const podElement = document.getElementById(podId);
            if (podElement) {
              podElement.classList.remove('pending');
              podElement.classList.add('running');
              newPod.status = 'running';
              logConsole(`Pod ${podName} status: RUNNING.`, 'success');
            }
            
            packetsFinished++;
            if (packetsFinished === countToAdd) {
              currentReplicas = podsList.length;
              currentImage = image;
              if (onComplete) onComplete();
              else finishSim();
            }
          }, 1500);
        });
      }
    }, 800);
  }

  /* Scale Down: Remove existing pods */
  function scaleDown(countToRemove, onComplete = null) {
    logConsole(`Controller Manager: Decommissioning ${countToRemove} Pod(s) to reconcile state...`, 'system');

    // Sort to remove newest/last pods
    let decommissionQueue = [];
    for (let i = 0; i < countToRemove; i++) {
      if (podsList.length > 0) {
        // Prioritize scaling down from node-2 if healthy to maintain balance, or just pop
        const pod = podsList.pop();
        decommissionQueue.push(pod);
      }
    }

    decommissionQueue.forEach(pod => {
      const podEl = document.getElementById(pod.id);
      if (podEl) {
        podEl.className = 'pod-unit terminating';
        logConsole(`Sending SIGTERM shutdown signal to Pod ${pod.name} on node-0${pod.node}.`, 'system');
      }
    });

    setTimeout(() => {
      decommissionQueue.forEach(pod => {
        const podEl = document.getElementById(pod.id);
        if (podEl) podEl.remove();
        logConsole(`Pod ${pod.name} successfully terminated and resource cleaned up.`, 'success');
      });

      currentReplicas = podsList.length;
      if (onComplete) onComplete();
      else finishSim();
    }, 1200);
  }

  /* Rolling Update: Replace pods one-by-one to maintain zero downtime */
  function rollingUpdate(targetCount, targetImage) {
    // Basic rolling update: Scale down old, Scale up new.
    // To make it look realistic, we will:
    // 1. Terminate all old pods in a sweep
    // 2. Spawn targetCount new pods with the new image.
    
    // 1. Decommission old pods
    const oldPodCount = podsList.length;
    logConsole(`Terminating ${oldPodCount} legacy Pods...`, 'system');
    
    podsList.forEach(pod => {
      const podEl = document.getElementById(pod.id);
      if (podEl) podEl.className = 'pod-unit terminating';
    });

    setTimeout(() => {
      clearPodsVisuals();
      podsList = []; // Wipe state array
      
      logConsole(`All legacy Pods terminated. Deploying new Pods with image ${targetImage}...`, 'system');
      
      // 2. Spawn new pods
      scaleUp(targetCount, targetImage, () => {
        logConsole(`Rolling update completed successfully! Active image: ${targetImage}.`, 'success');
        finishSim();
      });
    }, 1200);
  }

  /* Unlock UI buttons when simulation step completes */
  function finishSim() {
    deployBtn.disabled = false;
    deployBtn.innerText = 'kubectl apply -f deployment.yaml';
    isSimulating = false;
  }

  /* Induce worker node failure (Chaos Engineering) */
  function triggerNodeFailure() {
    if (podsList.length === 0) {
      logConsole('Chaos failed: Deploy some pods first before crashing a node!', 'error');
      return;
    }
    
    isSimulating = true;
    node2Healthy = false;
    
    logConsole('CRITICAL: node-02 heartbeat connection lost!', 'error');
    
    // Update node UI to failed state
    node2Status.style.background = 'hsl(var(--accent-red))';
    node2Status.style.boxShadow = '0 0 6px hsl(var(--accent-red))';
    node2El.style.opacity = '0.65';
    node2El.style.borderColor = 'hsl(var(--accent-red) / 0.5)';
    
    // Identify all pods running on Node 2
    const lostPods = podsList.filter(p => p.node === 2);
    
    if (lostPods.length === 0) {
      logConsole('node-02 was running 0 Pods. Control Plane monitoring node status.', 'warning');
      
      // Restore node automatically after a delay
      setTimeout(recoverNode, 4000);
      isSimulating = false;
      return;
    }

    logConsole(`Controller Manager: ${lostPods.length} Pods on node-02 marked as Terminating / Lost.`, 'warning');
    
    lostPods.forEach(pod => {
      const podEl = document.getElementById(pod.id);
      if (podEl) {
        podEl.className = 'pod-unit terminating';
      }
    });

    // Scheduler starts rescheduling them to node-01
    setTimeout(() => {
      // Remove lost pods from state
      podsList = podsList.filter(p => p.node !== 2);
      lostPods.forEach(p => {
        const el = document.getElementById(p.id);
        if (el) el.remove();
      });
      
      logConsole('Scheduler: Evicting lost Pods and rescheduling them to healthy node-01...', 'warning');
      
      cpScheduler.classList.add('active');
      
      setTimeout(() => {
        cpScheduler.classList.remove('active');
        
        let rescheduledCount = 0;
        
        lostPods.forEach(() => {
          animateDataPacket(cpScheduler, node1El, () => {
            logConsole(`Kubelet on node-01: Spin up container to replace lost resource.`, 'system');
            
            const podId = `pod-${randomString(5)}`;
            const podName = `web-app-${randomString(5)}`;
            const newPod = {
              id: podId,
              name: podName,
              node: 1, // Must go to Node 1
              status: 'pending',
              image: currentImage
            };
            
            podsList.push(newPod);
            renderPod(newPod);
            
            setTimeout(() => {
              const podElement = document.getElementById(podId);
              if (podElement) {
                podElement.classList.remove('pending');
                podElement.classList.add('running');
                newPod.status = 'running';
                logConsole(`Replacement Pod ${podName} is RUNNING on node-01.`, 'success');
              }
              
              rescheduledCount++;
              if (rescheduledCount === lostPods.length) {
                logConsole('Cluster capacity recovered to desired replica count on node-01.', 'success');
                isSimulating = false;
                
                // Trigger auto recovery of Node 2
                setTimeout(recoverNode, 3500);
              }
            }, 1500);
          });
        });
        
      }, 800);
    }, 1200);
  }

  /* Auto recover node after crash simulation */
  function recoverNode() {
    logConsole('System: node-02 heartbeat restored. Node state is Ready.', 'success');
    node2Status.style.background = 'hsl(var(--accent-green))';
    node2Status.style.boxShadow = '0 0 6px hsl(var(--accent-green))';
    node2El.style.opacity = '1';
    node2El.style.borderColor = 'var(--glass-border)';
    node2Healthy = true;
  }

  /* Flow packet SVG/DOM Animation Helper */
  function animateDataPacket(sourceEl, targetEl, callback) {
    const rectSource = sourceEl.getBoundingClientRect();
    const rectTarget = targetEl.getBoundingClientRect();
    const containerRect = flowContainer.getBoundingClientRect();
    
    // Start at center of source
    const startX = rectSource.left - containerRect.left + (rectSource.width / 2);
    const startY = rectSource.top - containerRect.top + (rectSource.height / 2);
    
    // Target at top-center of target node box
    const endX = rectTarget.left - containerRect.left + (rectTarget.width / 2);
    const endY = rectTarget.top - containerRect.top + 20;

    // Create DOM element for particle packet
    const packet = document.createElement('div');
    packet.className = 'flow-packet';
    packet.style.left = `${startX}px`;
    packet.style.top = `${startY}px`;
    
    flowContainer.appendChild(packet);
    
    // Force browser reflow to register style starting point
    packet.offsetHeight;
    
    // Animate to target coordinates
    packet.style.left = `${endX}px`;
    packet.style.top = `${endY}px`;
    
    // Clean up particle and trigger callbacks on finish
    setTimeout(() => {
      packet.remove();
      if (callback) callback();
    }, 800);
  }
}
