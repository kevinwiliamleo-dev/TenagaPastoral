
async function testLogin() {
  try {
    console.log("Testing Login Flow...");
    
    // 1. Get CSRF Token (simulated)
    const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
    const csrfData = await csrfRes.json();
    console.log("CSRF Token fetched:", csrfData.csrfToken ? "YES" : "NO");

    // 2. Attempt Login
    const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": csrfRes.headers.get("set-cookie") || ""
      },
      body: new URLSearchParams({
        email: "pastor@kpi.com",
        password: "staff123",
        csrfToken: csrfData.csrfToken,
        json: "true"
      })
    });

    console.log("Login Status:", loginRes.status);
    
    if (loginRes.ok) {
        console.log("Login Successful!");
        // 3. Check Dashboard Access
        const dashboardRes = await fetch("http://localhost:3000/id/dashboard", {
            headers: {
                "Cookie": loginRes.headers.get("set-cookie") || ""
            }
        });
        console.log("Dashboard Access Status:", dashboardRes.status);
        if (dashboardRes.status === 200) {
            console.log("✅ Dashboard is accessible!");
        } else {
            console.log("❌ Dashboard access failed.");
        }
    } else {
        console.log("❌ Login failed.");
    }

  } catch (error) {
    console.error("Test Failed:", error);
  }
}

testLogin();
