import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

import * as React from "react";

export default function Email({
    userName = "Vansh",
    type = "budget-alert",
    data={
        percentageUsed: 85,
        budgetAmount: 4000,
        totalExpenses: 3400,
    },
}) {
    if (type === "payment-reminder") {
        const days = Number(data?.daysBefore) || 1;
        const isSubscription = data?.kind === "SUBSCRIPTION";
        const typeLabel = isSubscription
            ? "SUBSCRIPTION"
            : `RECURRING ${data?.transactionType === "INCOME" ? "INCOME" : "EXPENSE"}`;
        const paymentLabel = isSubscription ? "subscription renewal" : `recurring ${data?.transactionType === "INCOME" ? "income" : "expense"} transaction`;
        return (
            <Html>
                <Head />
                <Preview>{data?.name} is due in {days} day{days === 1 ? "" : "s"}</Preview>
                <Body style={styles.body}>
                    <Container style={styles.container}>
                        <Heading style={styles.title}>Upcoming payment reminder</Heading>
                        <Text style={isSubscription ? styles.subscriptionBadge : styles.recurringBadge}>{typeLabel}</Text>
                        <Text style={styles.text}>Hello {userName || "there"},</Text>
                        <Text style={styles.text}>
                            Your {paymentLabel} <strong>{data?.name}</strong> is due in {days} day{days === 1 ? "" : "s"}.
                        </Text>
                        <Section style={styles.statsContainer}>
                            <Text style={styles.text}>Amount: <strong>₹{Number(data?.amount || 0).toLocaleString("en-IN")}</strong></Text>
                            <Text style={styles.text}>{isSubscription ? "Renewal date" : "Transaction date"}: <strong>{data?.paymentDate}</strong></Text>
                            {data?.frequency && <Text style={styles.text}>Frequency: <strong>{String(data.frequency).toLowerCase()}</strong></Text>}
                        </Section>
                        {data?.dashboardUrl && <Button href={data.dashboardUrl} style={styles.button}>Open MeraBudget</Button>}
                        <Text style={styles.note}>This is a reminder only. No payment has been initiated by MeraBudget.</Text>
                    </Container>
                </Body>
            </Html>
        );
    }

    if (type === "monthly-report"){
    }

    if( type === "budget-alert"){
    return (
        <Html>
            <Head />
            <Preview>Budget Alert</Preview>
            <Body style={styles.body}>
                <Container style ={styles.container}>
                    <Heading style ={styles.title}>Budget Alert</Heading>
                    <Text style={styles.text}>Hello {userName},</Text>
                    <Text style ={styles.text}>
                        You&rsquo;ve used {Number(data?.percentageUsed || 0).toFixed(1)}% of your monthly budget.
                    </Text>
                    <Section style ={styles.statsContainer}>
                        <div style={styles.stat}>
                            <Text style={styles.text}>Budget Amount</Text>
                            <Text style={styles.heading}>₹{data?.budgetAmount}</Text>
                        </div>
                        <div style={styles.stat}>
                        <Text style={styles.text}>Spent So Far</Text>
                        <Text style={styles.heading}>₹{data?.totalExpenses}</Text>
                        </div>
                        <div style={styles.stat}>
                        <Text style={styles.text}>Remaining</Text>
                        <Text style={styles.heading}>
                            ₹{data?.budgetAmount - data?.totalExpenses}
                        </Text>
                        </div>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
    }
}

const styles ={
    body: {
        backgroundColor: "#f6f9fc",
        fontFamily : "-apple-system, sans-serif",
    },
    container: {
        backgroundColor: "#ffffff",
        margin: "0 auto",
        padding: "20px",
        borderRadius: "5px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0,1)",
    },
    title:{
        color: "#1f2937",
        fontSize: "32px",
        fontWeight: "bold",
        textAlign: "Center",
        margin: "0 0 20px",
    },
    heading:{
        color: "#1f2937",
        fontSize: "20px",
        fontWeight: "600",
        margin: "0 0 16px",
    },
    text:{
        color: "#4b5563",
        fontSize: "16px",
        margin: "0 0 16px",
    },
    statsContainer:{
        margin: "32px 0",
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "5px",
    },
    stat:{
        marginBottom: "16px",
        padding: "12px",
        backgroundColor: "#fff",
        borderRadius: "4px",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    button: {
        backgroundColor: "#e9c46a",
        color: "#111827",
        padding: "12px 20px",
        borderRadius: "999px",
        fontWeight: "700",
        textDecoration: "none",
    },
    note: {
        color: "#6b7280",
        fontSize: "12px",
        marginTop: "24px",
    },
    subscriptionBadge: {
        display: "inline-block",
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
        fontSize: "11px",
        fontWeight: "700",
        padding: "6px 10px",
        borderRadius: "999px",
        marginBottom: "16px",
    },
    recurringBadge: {
        display: "inline-block",
        backgroundColor: "#fef3c7",
        color: "#92400e",
        fontSize: "11px",
        fontWeight: "700",
        padding: "6px 10px",
        borderRadius: "999px",
        marginBottom: "16px",
    },

};
