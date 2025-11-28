import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { 
  IndianRupee, 
  TrendingUp, 
  Pill, 
  Stethoscope,
  Users,
  Receipt,
  Wallet
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface MonthlyReport {
  month: string;
  treatmentEarnings: string;
  medicineEarnings: string;
  totalEarnings: string;
  totalExpenses: string;
  profit: string;
  patientCount: number;
  billCount: number;
}

interface ReportStats {
  currentMonth: MonthlyReport;
  lastMonth: MonthlyReport;
  last6Months: MonthlyReport[];
}

const COLORS = ["hsl(199, 89%, 48%)", "hsl(168, 75%, 42%)", "hsl(262, 83%, 58%)", "hsl(31, 92%, 55%)"];

export default function Reports() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));

  const { data: stats, isLoading } = useQuery<ReportStats>({
    queryKey: [`/api/reports?month=${selectedMonth}`],
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(currentDate, i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    };
  });

  const chartData = stats?.last6Months?.map((m) => ({
    month: m.month,
    Treatments: parseFloat(m.treatmentEarnings),
    Medicines: parseFloat(m.medicineEarnings),
    Expenses: parseFloat(m.totalExpenses),
  })).reverse() || [];

  const pieData = stats?.currentMonth ? [
    { name: "Treatments", value: parseFloat(stats.currentMonth.treatmentEarnings) },
    { name: "Medicines", value: parseFloat(stats.currentMonth.medicineEarnings) },
  ].filter(d => d.value > 0) : [];

  const currentMonthProfit = parseFloat(stats?.currentMonth?.profit || "0");
  const lastMonthProfit = parseFloat(stats?.lastMonth?.profit || "0");
  const profitChange = lastMonthProfit > 0 
    ? ((currentMonthProfit - lastMonthProfit) / lastMonthProfit * 100).toFixed(1)
    : "0";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Reports</h1>
          <p className="text-muted-foreground">Financial overview and analytics</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]" data-testid="select-month">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <IndianRupee className="h-5 w-5 text-chart-1" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-total-earnings">
                  ₹{parseFloat(stats?.currentMonth?.totalEarnings || "0").toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <Wallet className="h-5 w-5 text-chart-5" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-total-expenses">
                  ₹{parseFloat(stats?.currentMonth?.totalExpenses || "0").toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-net-profit">
                  ₹{currentMonthProfit.toLocaleString("en-IN")}
                </div>
                <p className={`text-xs mt-1 ${parseFloat(profitChange) >= 0 ? "text-chart-2" : "text-destructive"}`}>
                  {parseFloat(profitChange) >= 0 ? "+" : ""}{profitChange}% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <Users className="h-5 w-5 text-chart-3" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-patient-count">
                  {stats?.currentMonth?.patientCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  patients / {stats?.currentMonth?.billCount || 0} bills
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
            <CardDescription>Breakdown of treatments, medicines, and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                  />
                  <Legend />
                  <Bar dataKey="Treatments" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Medicines" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>This month's earnings breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No earnings yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Stethoscope className="h-5 w-5 text-chart-1" />
            <div>
              <CardTitle className="text-lg">Treatment Earnings</CardTitle>
              <CardDescription>This month's treatment revenue</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div className="text-4xl font-bold" data-testid="text-treatment-earnings">
                ₹{parseFloat(stats?.currentMonth?.treatmentEarnings || "0").toLocaleString("en-IN")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Pill className="h-5 w-5 text-chart-2" />
            <div>
              <CardTitle className="text-lg">Medicine Earnings</CardTitle>
              <CardDescription>This month's medicine revenue</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div className="text-4xl font-bold" data-testid="text-medicine-earnings">
                ₹{parseFloat(stats?.currentMonth?.medicineEarnings || "0").toLocaleString("en-IN")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
