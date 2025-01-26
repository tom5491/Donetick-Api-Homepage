require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
    const config = {
        serverURL: process.env.SERVER_URL,
        apiKey: process.env.API_KEY,
    };

    app.get('/api/tasks', async (req, res) => {
        const headers = {
            "secretkey": config.apiKey,
            "Content-Type": "application/json",
        };

        try {
            const response = await axios.get(`${config.serverURL.replace(/\/$/, '')}/eapi/v1/chore`, { headers, timeout: 5000 });
            const data = response.data;

            if (!Array.isArray(data)) {
                console.error("Unexpected response format from Donetick API");
                return res.status(500).json({ error: "Unexpected response format from Donetick API" });
            }

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            const twoDaysFromNow = new Date();
            twoDaysFromNow.setDate(now.getDate() + 2);

            const tasks = data.map(task => ({
                id: task.id,
                name: task.name,
                nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : null,
                status: task.status,
                priority: task.priority,
                labels: task.labels || null,
                isActive: task.isActive,
                frequency_type: task.frequency_type,
                frequency: task.frequency,
                frequency_metadata: task.frequency_metadata,
            }));

            const totalTasks = tasks.length;
            const tasksDueToday = tasks.filter(task => task.nextDueDate && task.nextDueDate.toDateString() === now.toDateString() && task.isActive).length;
            const tasksDueNextTwoDays = tasks.filter(task => task.nextDueDate && task.nextDueDate > tomorrow && task.nextDueDate <= twoDaysFromNow && task.isActive).length;
            const overdueTasks = tasks.filter(task => task.nextDueDate && task.nextDueDate < now && task.isActive).length;

            res.json({
                totalTasks,
                tasksDueToday,
                tasksDueNextTwoDays,
                overdueTasks,
            });
        } catch (error) {
            console.error("Error fetching tasks from Donetick:", error.message);
            res.status(500).json({ error: "Failed to fetch tasks from Donetick", details: error.message });
        }
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
})();
