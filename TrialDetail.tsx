import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, Link } from "wouter";
import { 
  ArrowLeft, 
  AlertTriangle, 
  FileText, 
  BarChart3, 
  ExternalLink,
  Sparkles,
  Download
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TrialDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [generatingComment, setGeneratingComment] = useState(false);
  
  const trialId = parseInt(id || "0");
  const { data, isLoading } = trpc.trials.getById.useQuery({ id: trialId });
  const { data: existingComment } = trpc.comments.getForTrial.useQuery(
    { trialId },
    { enabled: isAuthenticated }
  );
  
  const generateCommentMutation = trpc.comments.generate.useMutation({
    onSuccess: () => {
      toast.success("评论生成成功");
      setGeneratingComment(false);
    },
    onError: (error) => {
      toast.error(`生成失败: ${error.message}`);
      setGeneratingComment(false);
    }
  });

  const handleGenerateComment = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }
    setGeneratingComment(true);
    generateCommentMutation.mutate({ trialId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!data || !data.trial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">试验未找到</p>
            <Link href="/">
              <Button className="mt-4">返回首页</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { trial, flaws } = data;
  
  const highRiskFlaws = flaws.filter(f => f.riskLevel === "high");
  const mediumRiskFlaws = flaws.filter(f => f.riskLevel === "medium");
  const lowRiskFlaws = flaws.filter(f => f.riskLevel === "low");

  const getFlawCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      allocation_concealment: "分配隐藏",
      blinding_issues: "盲法问题",
      missing_data: "缺失数据",
      statistical_power: "统计功效",
      multiple_comparison: "多重比较",
      endpoint_substitution: "终点替代",
      other: "其他"
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-8 max-w-6xl">
        {/* Trial Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Badge variant={
              trial.trialPhase === "III" ? "default" :
              trial.trialPhase === "II" ? "secondary" : "outline"
            } className="text-sm">
              Phase {trial.trialPhase}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {trial.journal}
            </Badge>
            {highRiskFlaws.length > 0 && (
              <Badge variant="destructive" className="text-sm">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {highRiskFlaws.length} 高风险漏洞
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {trial.title}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {trial.authors && (
              <div>
                <span className="font-medium text-foreground">作者：</span>
                {trial.authors}
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">发表日期：</span>
              {new Date(trial.publicationDate).toLocaleDateString('zh-CN')}
            </div>
            {trial.doi && (
              <a 
                href={`https://doi.org/${trial.doi}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-primary hover:underline"
              >
                DOI: {trial.doi}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <FileText className="w-4 h-4 mr-2" />
              概览
            </TabsTrigger>
            <TabsTrigger value="flaws">
              <AlertTriangle className="w-4 h-4 mr-2" />
              漏洞分析 ({flaws.length})
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <BarChart3 className="w-4 h-4 mr-2" />
              统计指标
            </TabsTrigger>
            <TabsTrigger value="comment">
              <Sparkles className="w-4 h-4 mr-2" />
              生成评论
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>试验设计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {trial.indication && (
                    <div>
                      <div className="text-sm font-medium text-foreground mb-1">适应症</div>
                      <div className="text-sm text-muted-foreground">{trial.indication}</div>
                    </div>
                  )}
                  {trial.sampleSize && (
                    <div>
                      <div className="text-sm font-medium text-foreground mb-1">样本量</div>
                      <div className="text-sm text-muted-foreground">{trial.sampleSize} 例</div>
                    </div>
                  )}
                  {trial.randomization && (
                    <div>
                      <div className="text-sm font-medium text-foreground mb-1">随机化方法</div>
                      <div className="text-sm text-muted-foreground">{trial.randomization}</div>
                    </div>
                  )}
                  {trial.blinding && (
                    <div>
                      <div className="text-sm font-medium text-foreground mb-1">盲法</div>
                      <div className="text-sm text-muted-foreground">{trial.blinding}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>研究终点</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trial.primaryEndpoint && (
                  <div>
                    <div className="text-sm font-medium text-foreground mb-1">主要终点</div>
                    <div className="text-sm text-muted-foreground">{trial.primaryEndpoint}</div>
                  </div>
                )}
                {trial.secondaryEndpoint && (
                  <div>
                    <div className="text-sm font-medium text-foreground mb-1">次要终点</div>
                    <div className="text-sm text-muted-foreground">{trial.secondaryEndpoint}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>关键结果</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {trial.keyResults || "暂无数据"}
                </p>
              </CardContent>
            </Card>

            {trial.conclusion && (
              <Card>
                <CardHeader>
                  <CardTitle>结论</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {trial.conclusion}
                  </p>
                </CardContent>
              </Card>
            )}

            {trial.abstractText && (
              <Card>
                <CardHeader>
                  <CardTitle>摘要</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {trial.abstractText}
                  </p>
                </CardContent>
              </Card>
            )}

            {trial.figureUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>试验关键图表</CardTitle>
                  <CardDescription>来自原始论文的主要结果图表</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                    <img 
                      src={trial.figureUrl} 
                      alt="Trial Figure" 
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                  {trial.sourceUrl && (
                    <a 
                      href={trial.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-3 inline-flex items-center gap-1"
                    >
                      查看原文完整图表
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Flaws Tab */}
          <TabsContent value="flaws" className="space-y-6">
            {flaws.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">未识别到明显方法学漏洞</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {highRiskFlaws.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      高风险漏洞 ({highRiskFlaws.length})
                    </h3>
                    {highRiskFlaws.map((flaw) => (
                      <Alert key={flaw.id} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{getFlawCategoryLabel(flaw.flawCategory)}</AlertTitle>
                        <AlertDescription className="mt-2 space-y-2">
                          <p>{flaw.description}</p>
                          {flaw.evidence && (
                            <p className="text-xs italic">证据：{flaw.evidence}</p>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {mediumRiskFlaws.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      中风险漏洞 ({mediumRiskFlaws.length})
                    </h3>
                    {mediumRiskFlaws.map((flaw) => (
                      <Alert key={flaw.id} className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertTitle>{getFlawCategoryLabel(flaw.flawCategory)}</AlertTitle>
                        <AlertDescription className="mt-2 space-y-2">
                          <p>{flaw.description}</p>
                          {flaw.evidence && (
                            <p className="text-xs italic">证据：{flaw.evidence}</p>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {lowRiskFlaws.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      低风险漏洞 ({lowRiskFlaws.length})
                    </h3>
                    {lowRiskFlaws.map((flaw) => (
                      <Alert key={flaw.id}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{getFlawCategoryLabel(flaw.flawCategory)}</AlertTitle>
                        <AlertDescription className="mt-2 space-y-2">
                          <p>{flaw.description}</p>
                          {flaw.evidence && (
                            <p className="text-xs italic">证据：{flaw.evidence}</p>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <Card>
              <CardHeader>
                <CardTitle>统计指标</CardTitle>
                <CardDescription>HR、CI、P值等关键统计数据</CardDescription>
              </CardHeader>
              <CardContent>
                {trial.statisticalMetrics ? (
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {trial.statisticalMetrics}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无统计指标数据</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comment Tab */}
          <TabsContent value="comment" className="space-y-6">
            {!isAuthenticated ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">登录后可生成评论</p>
                  <Button>登录</Button>
                </CardContent>
              </Card>
            ) : existingComment ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>生成的评论</CardTitle>
                      <CardDescription>
                        约 {existingComment.wordCount} 字 · 
                        生成于 {new Date(existingComment.createdAt).toLocaleString('zh-CN')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        导出
                      </Button>
                      <Button size="sm" onClick={handleGenerateComment} disabled={generatingComment}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        重新生成
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">
                      {existingComment.editedText || existingComment.commentText}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    基于试验数据和漏洞分析，自动生成结构化Correspondence评论
                  </p>
                  <Button 
                    size="lg" 
                    onClick={handleGenerateComment}
                    disabled={generatingComment}
                  >
                    {generatingComment ? (
                      <>生成中...</>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        生成评论
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
