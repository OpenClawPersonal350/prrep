import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Star, 
  ThumbsUp,
  MessageSquare,
  RefreshCw,
  Calendar,
  BarChart3,
  Tag,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInsights, getInsightsHistory, generateInsights, Insight } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Insights = () => {
  const [insights, setInsights] = useState<Insight | null>(null);
  const [history, setHistory] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const [insightsRes, historyRes] = await Promise.all([
        getInsights(),
        getInsightsHistory(4)
      ]);
      
      if (insightsRes.success) {
        setInsights(insightsRes.data);
      }
      if (historyRes.success) {
        setHistory(historyRes.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await generateInsights();
      
      if (response.success) {
        setInsights(response.data);
        toast({
          title: "Insights Generated",
          description: "Your weekly insights are ready!",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: err.message || "Could not generate insights",
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Insights Yet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your reviews and we'll generate insights automatically every week.
          </p>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Insights</h1>
          <p className="text-muted-foreground">
            AI-powered analysis of your reviews from the last 7 days
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} variant="outline">
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </>
          )}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-3xl font-bold">{insights.reviewCount}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-3xl font-bold flex items-center gap-1">
                  {insights.averageRating.toFixed(1)}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive</p>
                <p className="text-3xl font-bold text-green-500">
                  {insights.positivePercentage}%
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-lg font-semibold">
                  {formatDate(insights.periodStart)} - {formatDate(insights.periodEnd)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      {insights.summary && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">AI Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{insights.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Praises */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Praises
            </CardTitle>
            <CardDescription>Most common positive feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.topPraises.length > 0 ? (
              <div className="space-y-3">
                {insights.topPraises.slice(0, 5).map((praise, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium capitalize">{praise.keyword}</span>
                    </div>
                    <Badge variant="secondary">{praise.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No praise data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Complaints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Top Complaints
            </CardTitle>
            <CardDescription>Most common negative feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.topComplaints.length > 0 ? (
              <div className="space-y-3">
                {insights.topComplaints.slice(0, 5).map((complaint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium capitalize">{complaint.keyword}</span>
                    </div>
                    <Badge variant="secondary">{complaint.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No complaints detected!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Common Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Common Keywords
          </CardTitle>
          <CardDescription>Frequently mentioned terms in your reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {insights.commonKeywords.slice(0, 15).map((keyword, index) => (
              <Badge 
                key={index} 
                variant="outline"
                className="text-sm py-1.5"
              >
                {keyword.keyword} ({keyword.count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-green-500">Positive</span>
              <span className="font-medium">{insights.positivePercentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${insights.positivePercentage}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-yellow-500">Neutral</span>
              <span className="font-medium">{insights.neutralPercentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${insights.neutralPercentage}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-red-500">Negative</span>
              <span className="font-medium">{insights.negativePercentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${insights.negativePercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {history.slice(1).map((item) => (
                <div 
                  key={item._id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => setInsights(item)}
                >
                  <p className="font-medium">{formatDate(item.generatedAt)}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.reviewCount} reviews • {item.averageRating.toFixed(1)} ★
                  </p>
                  <p className="text-sm text-green-500">
                    {item.positivePercentage}% positive
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Insights;
