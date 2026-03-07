import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { apiService } from "@/lib/api";

interface PlanInfo {
  id: string;
  name: string;
  price: number;
  dailyLimit: number;
}

const PLANS: PlanInfo[] = [
  { id: "free", name: "Free", price: 0, dailyLimit: 5 },
  { id: "go", name: "Go", price: 29, dailyLimit: 200 },
  { id: "pro", name: "Pro", price: 79, dailyLimit: 1000 },
  { id: "ultra", name: "Ultra", price: 199, dailyLimit: 5000 },
];

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    currentPeriodEnd: number | null;
    dailyLimit: number;
  } | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSubscription();
      if (response.success) {
        setSubscription({
          plan: response.plan || 'free',
          status: response.status || 'active',
          currentPeriodEnd: response.currentPeriodEnd,
          dailyLimit: response.dailyLimit || 5
        });
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      // Default to free plan on error
      setSubscription({
        plan: 'free',
        status: 'active',
        currentPeriodEnd: null,
        dailyLimit: 5
      });
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = PLANS.find(p => p.id === subscription?.plan) || PLANS[0];

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription plan.</p>
      </div>

      {/* Current Plan - Now fetched from API */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-foreground">Current Plan</h3>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {currentPlan.name}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-1">
          {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/month`} · {currentPlan.dailyLimit.toLocaleString()} replies/day
        </p>
        <p className="text-xs text-muted-foreground">
          {subscription?.status === 'active' && subscription?.currentPeriodEnd 
            ? `Next billing date: ${formatDate(subscription.currentPeriodEnd)}`
            : subscription?.status === 'past_due' 
              ? 'Payment past due - Please update your payment method'
              : subscription?.status === 'canceled'
                ? 'Subscription canceled'
                : 'Current plan'
          }
        </p>
      </motion.div>

      {/* Plan Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan, i) => {
          const isCurrent = plan.id === subscription?.plan;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`glass rounded-xl p-5 text-center ${isCurrent ? "glow-primary border-primary/30" : ""}`}
            >
              <h4 className="font-semibold text-foreground mb-1">{plan.name}</h4>
              <p className="text-xl font-bold text-foreground mb-1">
                {plan.price === 0 ? '$0' : `$${plan.price}`}/mo
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {plan.dailyLimit.toLocaleString()} replies
              </p>
              {isCurrent ? (
                <Button size="sm" className="w-full bg-muted text-muted-foreground cursor-default" disabled>
                  Current
                </Button>
              ) : (
                <Link to={plan.price > currentPlan.price ? "/dashboard/upgrade" : "/dashboard/upgrade"}>
                  <Button 
                    size="sm" 
                    className={`w-full ${plan.price > currentPlan.price ? 'gradient-primary text-primary-foreground hover:opacity-90' : 'bg-muted hover:bg-muted/80'}`}
                  >
                    {plan.price > currentPlan.price ? 'Upgrade' : plan.price === 0 ? 'Downgrade' : 'Switch'}
                  </Button>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Billing;
