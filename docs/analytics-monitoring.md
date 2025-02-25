# Analytics and Monitoring for Chain Key Finance

This document outlines the analytics and monitoring implementation for the Chain Key Finance application.

## 1. Usage Analytics

### Metrics to Track

1. **User Metrics**
   - Daily/Monthly Active Users (DAU/MAU)
   - New User Registrations
   - User Retention Rate
   - User Geographic Distribution

2. **Transaction Metrics**
   - Transaction Volume (by token)
   - Transaction Count (by token)
   - Average Transaction Size
   - Transaction Success Rate

3. **DEX Metrics**
   - Trading Volume (by pair)
   - Order Count (by pair)
   - Liquidity Depth
   - Spread Analysis
   - Price Volatility

4. **ISO Dapp Metrics**
   - Deposit Volume (by token)
   - Deposit Count (by token)
   - Minting Volume (by token)
   - Average Deposit Size

### Analytics Implementation

We'll implement analytics tracking in each canister:

```motoko
// Add to each canister

// Analytics
private stable var userMetrics : [(Principal, Int)] = []; // user, last active timestamp
private stable var transactionMetrics : [(Text, Principal, Principal, Nat, Int)] = []; // token, from, to, amount, timestamp
private stable var dexMetrics : [(Text, Text, Nat, Float, Int)] = []; // pair, order type, amount, price, timestamp
private stable var isoMetrics : [(Text, Principal, Nat, Int)] = []; // token, user, amount, timestamp

// Track user activity
private func trackUserActivity(user : Principal) : () {
  let now = Time.now();
  
  // Update user's last active timestamp
  userMetrics := Array.filter(userMetrics, func((p, _) : (Principal, Int)) : Bool {
    p != user
  });
  
  userMetrics := Array.append(userMetrics, [(user, now)]);
}

// Track transaction
private func trackTransaction(token : Text, from : Principal, to : Principal, amount : Nat) : () {
  let now = Time.now();
  
  transactionMetrics := Array.append(transactionMetrics, [(token, from, to, amount, now)]);
  
  // Trim metrics if they get too large
  if (transactionMetrics.size() > 10000) {
    transactionMetrics := Array.subArray(transactionMetrics, transactionMetrics.size() - 10000, 10000);
  };
}

// Track DEX order
private func trackDexOrder(pair : Text, orderType : Text, amount : Nat, price : Float) : () {
  let now = Time.now();
  
  dexMetrics := Array.append(dexMetrics, [(pair, orderType, amount, price, now)]);
  
  // Trim metrics if they get too large
  if (dexMetrics.size() > 10000) {
    dexMetrics := Array.subArray(dexMetrics, dexMetrics.size() - 10000, 10000);
  };
}

// Track ISO deposit
private func trackIsoDeposit(token : Text, user : Principal, amount : Nat) : () {
  let now = Time.now();
  
  isoMetrics := Array.append(isoMetrics, [(token, user, amount, now)]);
  
  // Trim metrics if they get too large
  if (isoMetrics.size() > 10000) {
    isoMetrics := Array.subArray(isoMetrics, isoMetrics.size() - 10000, 10000);
  };
}

// Get user metrics
public query func getUserMetrics(startTime : Int, endTime : Int) : async {
  activeUsers : Nat;
  newUsers : Nat;
  retentionRate : Float;
} {
  let activeUsers = Array.filter(userMetrics, func((_, timestamp) : (Principal, Int)) : Bool {
    timestamp >= startTime and timestamp <= endTime
  }).size();
  
  // Calculate new users (simplified)
  let newUsers = 0;
  
  // Calculate retention rate (simplified)
  let retentionRate = 0.0;
  
  {
    activeUsers = activeUsers;
    newUsers = newUsers;
    retentionRate = retentionRate;
  }
}

// Get transaction metrics
public query func getTransactionMetrics(token : ?Text, startTime : Int, endTime : Int) : async {
  volume : Nat;
  count : Nat;
  averageSize : Float;
} {
  let filteredTransactions = Array.filter(transactionMetrics, func((t, _, _, _, timestamp) : (Text, Principal, Principal, Nat, Int)) : Bool {
    (switch (token) {
      case (null) { true };
      case (?t) { t == t };
    }) and timestamp >= startTime and timestamp <= endTime
  });
  
  let count = filteredTransactions.size();
  let volume = Array.foldLeft(filteredTransactions, 0, func((acc, (_, _, _, amount, _)) : (Nat, (Text, Principal, Principal, Nat, Int))) : Nat {
    acc + amount
  });
  
  let averageSize = if (count == 0) { 0.0 } else { Float.fromInt(volume) / Float.fromInt(count) };
  
  {
    volume = volume;
    count = count;
    averageSize = averageSize;
  }
}

// Use in public functions
public shared(msg) func someFunction() : async () {
  let caller = msg.caller;
  
  trackUserActivity(caller);
  
  // Function implementation
}
```

### Analytics Dashboard

We'll create a dashboard to visualize the analytics data:

```javascript
// analytics-dashboard.js

// Fetch analytics data from canisters
async function fetchAnalytics() {
  const now = Date.now() * 1000000; // Convert to nanoseconds
  const dayAgo = now - 24 * 60 * 60 * 1000000000;
  
  // Fetch user metrics
  const userMetrics = await isoDapp.getUserMetrics(dayAgo, now);
  
  // Fetch transaction metrics
  const btcMetrics = await isoDapp.getTransactionMetrics('BTC', dayAgo, now);
  const ethMetrics = await isoDapp.getTransactionMetrics('ETH', dayAgo, now);
  const solMetrics = await isoDapp.getTransactionMetrics('SOL', dayAgo, now);
  const usdcMetrics = await isoDapp.getTransactionMetrics('USDC', dayAgo, now);
  
  // Fetch DEX metrics
  const dexMetrics = await dex.getMetrics(dayAgo, now);
  
  // Update dashboard
  updateUserMetricsChart(userMetrics);
  updateTransactionMetricsChart([btcMetrics, ethMetrics, solMetrics, usdcMetrics]);
  updateDexMetricsChart(dexMetrics);
}

// Update user metrics chart
function updateUserMetricsChart(metrics) {
  const ctx = document.getElementById('userMetricsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Active Users', 'New Users'],
      datasets: [{
        label: 'User Metrics',
        data: [metrics.activeUsers, metrics.newUsers],
        backgroundColor: [
          'rgba(54, 162, 235, 0.2)',
          'rgba(75, 192, 192, 0.2)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Update transaction metrics chart
function updateTransactionMetricsChart(metrics) {
  const ctx = document.getElementById('transactionMetricsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['BTC', 'ETH', 'SOL', 'USDC'],
      datasets: [{
        label: 'Transaction Volume',
        data: metrics.map(m => m.volume),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }, {
        label: 'Transaction Count',
        data: metrics.map(m => m.count),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Update DEX metrics chart
function updateDexMetricsChart(metrics) {
  const ctx = document.getElementById('dexMetricsChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: metrics.timestamps.map(t => new Date(t / 1000000).toLocaleTimeString()),
      datasets: [{
        label: 'Trading Volume',
        data: metrics.volumes,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Fetch analytics data every 5 minutes
setInterval(fetchAnalytics, 5 * 60 * 1000);

// Initial fetch
fetchAnalytics();
```

## 2. Performance Monitoring

### Metrics to Track

1. **Canister Metrics**
   - Cycles Consumption
   - Memory Usage
   - Instruction Count
   - Call Latency

2. **Operation Metrics**
   - Operation Latency
   - Operation Success Rate
   - Error Rate
   - Throughput

3. **Network Metrics**
   - Request Count
   - Response Time
   - Bandwidth Usage
   - Error Rate

### Performance Monitoring Implementation

We'll implement performance monitoring in each canister:

```motoko
// Add to each canister

// Performance monitoring
private stable var operationLatency : [(Text, Int, Int)] = []; // operation, start time, end time
private stable var operationErrors : [(Text, Text, Int)] = []; // operation, error, timestamp
private stable var operationCounts : [(Text, Int)] = []; // operation, count

// Track operation latency
private func trackOperationLatency(operation : Text, startTime : Int, endTime : Int) : () {
  operationLatency := Array.append(operationLatency, [(operation, startTime, endTime)]);
  
  // Trim metrics if they get too large
  if (operationLatency.size() > 1000) {
    operationLatency := Array.subArray(operationLatency, operationLatency.size() - 1000, 1000);
  };
}

// Track operation error
private func trackOperationError(operation : Text, error : Text) : () {
  let now = Time.now();
  
  operationErrors := Array.append(operationErrors, [(operation, error, now)]);
  
  // Trim metrics if they get too large
  if (operationErrors.size() > 1000) {
    operationErrors := Array.subArray(operationErrors, operationErrors.size() - 1000, 1000);
  };
}

// Track operation count
private func trackOperationCount(operation : Text) : () {
  let count = switch (Array.find(operationCounts, func((op, _) : (Text, Int)) : Bool { op == operation })) {
    case (null) { 0 };
    case (?(_, c)) { c };
  };
  
  operationCounts := Array.filter(operationCounts, func((op, _) : (Text, Int)) : Bool { op != operation });
  operationCounts := Array.append(operationCounts, [(operation, count + 1)]);
}

// Get performance metrics
public query func getPerformanceMetrics(startTime : Int, endTime : Int) : async {
  operationLatency : [(Text, Float)]; // operation, average latency
  errorRate : [(Text, Float)]; // operation, error rate
  throughput : [(Text, Float)]; // operation, operations per second
} {
  let filteredLatency = Array.filter(operationLatency, func((_, start, end) : (Text, Int, Int)) : Bool {
    start >= startTime and end <= endTime
  });
  
  let filteredErrors = Array.filter(operationErrors, func((_, _, timestamp) : (Text, Text, Int)) : Bool {
    timestamp >= startTime and timestamp <= endTime
  });
  
  // Calculate average latency by operation
  let operations = Array.map(operationCounts, func((op, _) : (Text, Int)) : Text { op });
  let uniqueOperations = Array.filter(operations, func(op : Text) : Bool {
    Array.indexOf(op, operations) == ?Array.indexOf(op, operations).0
  });
  
  let avgLatency = Array.map(uniqueOperations, func(op : Text) : (Text, Float) {
    let opLatency = Array.filter(filteredLatency, func((o, _, _) : (Text, Int, Int)) : Bool { o == op });
    let totalLatency = Array.foldLeft(opLatency, 0, func((acc, (_, start, end)) : (Int, (Text, Int, Int))) : Int {
      acc + (end - start)
    });
    let avgLatency = if (opLatency.size() == 0) { 0.0 } else { Float.fromInt(totalLatency) / Float.fromInt(opLatency.size()) };
    (op, avgLatency)
  });
  
  // Calculate error rate by operation
  let errorRate = Array.map(uniqueOperations, func(op : Text) : (Text, Float) {
    let opErrors = Array.filter(filteredErrors, func((o, _, _) : (Text, Text, Int)) : Bool { o == op });
    let opCount = switch (Array.find(operationCounts, func((o, _) : (Text, Int)) : Bool { o == op })) {
      case (null) { 0 };
      case (?(_, c)) { c };
    };
    let errorRate = if (opCount == 0) { 0.0 } else { Float.fromInt(opErrors.size()) / Float.fromInt(opCount) };
    (op, errorRate)
  });
  
  // Calculate throughput by operation
  let throughput = Array.map(uniqueOperations, func(op : Text) : (Text, Float) {
    let opCount = switch (Array.find(operationCounts, func((o, _) : (Text, Int)) : Bool { o == op })) {
      case (null) { 0 };
      case (?(_, c)) { c };
    };
    let timeRange = Float.fromInt(endTime - startTime) / 1_000_000_000.0; // Convert to seconds
    let throughput = if (timeRange == 0.0) { 0.0 } else { Float.fromInt(opCount) / timeRange };
    (op, throughput)
  });
  
  {
    operationLatency = avgLatency;
    errorRate = errorRate;
    throughput = throughput;
  }
}

// Use in public functions
public shared(msg) func someFunction() : async () {
  let startTime = Time.now();
  
  trackOperationCount("someFunction");
  
  try {
    // Function implementation
  } catch (e) {
    trackOperationError("someFunction", Error.message(e));
    throw e;
  };
  
  let endTime = Time.now();
  trackOperationLatency("someFunction", startTime, endTime);
}
```

### Performance Dashboard

We'll create a dashboard to visualize the performance data:

```javascript
// performance-dashboard.js

// Fetch performance data from canisters
async function fetchPerformanceMetrics() {
  const now = Date.now() * 1000000; // Convert to nanoseconds
  const hourAgo = now - 60 * 60 * 1000000000;
  
  // Fetch performance metrics
  const isoDappMetrics = await isoDapp.getPerformanceMetrics(hourAgo, now);
  const dexMetrics = await dex.getPerformanceMetrics(hourAgo, now);
  const tokenMetrics = await ckBTC.getPerformanceMetrics(hourAgo, now);
  
  // Update dashboard
  updateLatencyChart([isoDappMetrics, dexMetrics, tokenMetrics]);
  updateErrorRateChart([isoDappMetrics, dexMetrics, tokenMetrics]);
  updateThroughputChart([isoDappMetrics, dexMetrics, tokenMetrics]);
}

// Update latency chart
function updateLatencyChart(metrics) {
  const ctx = document.getElementById('latencyChart').getContext('2d');
  
  // Prepare data
  const labels = [];
  const datasets = [];
  
  metrics.forEach((metric, index) => {
    const canisterName = ['ISO Dapp', 'DEX', 'Token'][index];
    const data = [];
    
    metric.operationLatency.forEach(([operation, latency]) => {
      if (!labels.includes(operation)) {
        labels.push(operation);
      }
      data[labels.indexOf(operation)] = latency / 1000000; // Convert to milliseconds
    });
    
    datasets.push({
      label: canisterName,
      data: data,
      backgroundColor: [
        'rgba(54, 162, 235, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(255, 206, 86, 0.2)'
      ][index],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)'
      ][index],
      borderWidth: 1
    });
  });
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Latency (ms)'
          }
        }
      }
    }
  });
}

// Update error rate chart
function updateErrorRateChart(metrics) {
  const ctx = document.getElementById('errorRateChart').getContext('2d');
  
  // Prepare data
  const labels = [];
  const datasets = [];
  
  metrics.forEach((metric, index) => {
    const canisterName = ['ISO Dapp', 'DEX', 'Token'][index];
    const data = [];
    
    metric.errorRate.forEach(([operation, rate]) => {
      if (!labels.includes(operation)) {
        labels.push(operation);
      }
      data[labels.indexOf(operation)] = rate * 100; // Convert to percentage
    });
    
    datasets.push({
      label: canisterName,
      data: data,
      backgroundColor: [
        'rgba(54, 162, 235, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(255, 206, 86, 0.2)'
      ][index],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)'
      ][index],
      borderWidth: 1
    });
  });
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Error Rate (%)'
          }
        }
      }
    }
  });
}

// Update throughput chart
function updateThroughputChart(metrics) {
  const ctx = document.getElementById('throughputChart').getContext('2d');
  
  // Prepare data
  const labels = [];
  const datasets = [];
  
  metrics.forEach((metric, index) => {
    const canisterName = ['ISO Dapp', 'DEX', 'Token'][index];
    const data = [];
    
    metric.throughput.forEach(([operation, throughput]) => {
      if (!labels.includes(operation)) {
        labels.push(operation);
      }
      data[labels.indexOf(operation)] = throughput;
    });
    
    datasets.push({
      label: canisterName,
      data: data,
      backgroundColor: [
        'rgba(54, 162, 235, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(255, 206, 86, 0.2)'
      ][index],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)'
      ][index],
      borderWidth: 1
    });
  });
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Operations per Second'
          }
        }
      }
    }
  });
}

// Fetch performance metrics every minute
setInterval(fetchPerformanceMetrics, 60 * 1000);

// Initial fetch
fetchPerformanceMetrics();
```

## 3. Canister Health Monitoring

### Metrics to Track

1. **Cycles Balance**
   - Current Cycles Balance
   - Cycles Consumption Rate
   - Projected Depletion Date

2. **Memory Usage**
   - Current Memory Usage
   - Memory Growth Rate
   - Projected Memory Limit Breach

3. **Heap Usage**
   - Current Heap Usage
   - Heap Growth Rate
   - Garbage Collection Frequency

### Canister Health Implementation

We'll implement canister health monitoring:

```motoko
// Add to each canister

// Canister health monitoring
private stable var cyclesHistory : [(Int, Nat)] = []; // timestamp, cycles balance
private stable var memoryHistory : [(Int, Nat)] = []; // timestamp, memory usage
private stable var heapHistory : [(Int, Nat)] = []; // timestamp, heap usage

// Track cycles balance
private func trackCyclesBalance() : async () {
  let now = Time.now();
  let balance = ExperimentalCycles.balance();
  
  cyclesHistory := Array.append(cyclesHistory, [(now, balance)]);
  
  // Trim history if it gets too large
  if (cyclesHistory.size() > 1000) {
    cyclesHistory := Array.subArray(cyclesHistory, cyclesHistory.size() - 1000, 1000);
  };
}

// Track memory usage
private func trackMemoryUsage() : () {
  let now = Time.now();
  let memory = Prim.rts_memory_size();
  
  memoryHistory := Array.append(memoryHistory, [(now, memory)]);
  
  // Trim history if it gets too large
  if (memoryHistory.size() > 1000) {
    memoryHistory := Array.subArray(memoryHistory, memoryHistory.size() - 1000, 1000);
  };
}

// Track heap usage
private func trackHeapUsage() : () {
  let now = Time.now();
  let heap = Prim.rts_heap_size();
  
  heapHistory := Array.append(heapHistory, [(now, heap)]);
  
  // Trim history if it gets too large
  if (heapHistory.size() > 1000) {
    heapHistory := Array.subArray(heapHistory, heapHistory.size() - 1000, 1000);
  };
}

// Get canister health metrics
public query func getCanisterHealth() : async {
  cyclesBalance : Nat;
  cyclesConsumptionRate : Float;
  projectedDepletionDays : Float;
  memoryUsage : Nat;
  memoryGrowthRate : Float;
  projectedMemoryLimitDays : Float;
  heapUsage : Nat;
  heapGrowthRate : Float;
} {
  let now = Time.now();
  
  // Get current values
  let cyclesBalance = if (cyclesHistory.size() == 0) { 0 } else { cyclesHistory[cyclesHistory.size() - 1].1 };
  let memoryUsage = if (memoryHistory.size() == 0) { 0 } else { memoryHistory[memoryHistory.size() - 1].1 };
  let heapUsage = if (heapHistory.size() == 0) { 0 } else { heapHistory[heapHistory.size() - 1].1 };
  
  // Calculate rates (per day)
  let cyclesConsumptionRate = if (cyclesHistory.size() < 2) { 0.0 } else {
    let oldest = cyclesHistory[0];
    let newest = cyclesHistory[cyclesHistory.size() - 1];
    let daysPassed = Float.fromInt(newest.0 - oldest.0) / (24.0 * 60.0 * 60.0 * 1_000_000_000.0);
    if (daysPassed == 0.0) { 0.0 } else { Float.fromInt(oldest.1 - newest.1) / daysPassed }
  };
  
  let memoryGrowthRate = if (memoryHistory.size() < 2) { 0.0 } else {
    let oldest = memoryHistory[0];
    let newest = memoryHistory[memoryHistory.size() - 1];
    let daysPassed = Float.fromInt(newest.0 - oldest.0) / (24.0 * 60.0 * 60.0 * 1_000_000_000.0);
    if (daysPassed == 0.0) { 0.0 } else { Float.fromInt(newest.1 - oldest.1) / daysPassed }
  };
  
  let heapGrowthRate = if (heapHistory.size() < 2) { 0.0 } else {
    let oldest = heapHistory[0];
    let newest = heapHistory[heapHistory.size() - 1];
    let daysPassed = Float.fromInt(newest.0 - oldest.0) / (24.0 * 60.0 * 60.0 * 1_000_000_000.0);
    if (daysPassed == 0.0) { 0.0 } else { Float.fromInt(newest.1 - oldest.1) / daysPassed }
  };
  
  // Calculate projections
  let projectedDepletionDays = if (cyclesConsumptionRate <= 0.0) { 999999.0 } else { Float.fromInt(cyclesBalance) / cyclesConsumptionRate };
  
  let memoryLimit = 4_294_967_296; // 4GB
  let projectedMemoryLimitDays = if (memoryGrowthRate <= 0.0) { 999999.0 } else { Float.fromInt(memoryLimit - memoryUsage) / memoryGrowthRate };
  
  {
    cyclesBalance = cyclesBalance;
    cyclesConsumptionRate = cyclesConsumptionRate;
    projectedDepletionDays = projectedDepletionDays;
    memoryUsage = memoryUsage;
    memoryGrowthRate = memoryGrowthRate;
    projectedMemoryLimitDays = projectedMemoryLimitDays;
    heapUsage = heapUsage;
    heapGrowthRate = heapGrowthRate;
  }
}

// Heartbeat to track canister health
system func heartbeat() : async () {
  await trackCyclesBalance();
  trackMemoryUsage();
  trackHeapUsage();
}
```

### Canister Health Dashboard

We'll create a dashboard to visualize the canister health data:

```javascript
// canister-health-dashboard.js

// Fetch canister health data
async function fetchCanisterHealth() {
  // Fetch canister health metrics
  const isoDappHealth = await isoDapp.getCanisterHealth();
  const dexHealth = await dex.getCanisterHealth();
  const ckBTCHealth = await ckBTC.getCanisterHealth();
  const ckETHHealth = await ckETH.getCanisterHealth();
  const ckSOLHealth = await ckSOL.getCanisterHealth();
  const ckUSDCHealth = await ckUSDC.getCanisterHealth();
  
  // Update dashboard
  updateCyclesChart([
    { name: 'ISO Dapp', health: isoDappHealth },
    { name: 'DEX', health: dexHealth },
    { name: 'ckBTC', health: ckBTCHealth },
    { name: 'ckETH', health: ckETHHealth },
    { name: 'ckSOL', health: ckSOLHealth },
    { name: 'ckUSDC', health: ckUSDCHealth }
  ]);
  
  updateMemoryChart([
    { name: 'ISO Dapp', health: isoDappHealth },
    { name: 'DEX', health: dexHealth },
    { name: 'ckBTC', health: ckBTCHealth },
    { name: 'ckETH', health: ckETHHealth },
    { name: 'ckSOL', health: ckSOLHealth },
    { name: 'ckUSDC', health: ckUSDCHealth }
  ]);
  
  updateProjectionsTable([
    { name: 'ISO Dapp', health: isoDappHealth },
    { name: 'DEX', health: dexHealth },
    { name: 'ckBTC', health: ckBTCHealth },
    { name: 'ckETH', health: ckETHHealth },
    { name: 'ckSOL', health: ckSOLHealth },
    { name: 'ckUSDC', health: ckUSDCHealth }
  ]);
}

// Update cycles chart
function updateCyclesChart(canisters) {
  const ctx = document.getElementById('cyclesChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: canisters.map(c => c.name),
      datasets: [{
        label: 'Cycles Balance',
        data: canisters.map(c => c.health.cyclesBalance / 1_000_000_000_000), // Convert to T cycles
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
