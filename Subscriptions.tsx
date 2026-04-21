import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { ArrowLeft, Bell, Plus, Trash2, Edit, Mail } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Subscriptions() {
  const { user, isAuthenticated } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSubscriptionName, setNewSubscriptionName] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newIndications, setNewIndications] = useState("");
  const [newEmailEnabled, setNewEmailEnabled] = useState(true);

  const { data: subscriptions, isLoading, refetch } = trpc.subscriptions.getMy.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.subscriptions.create.useMutation({
    onSuccess: () => {
      toast.success("订阅创建成功");
      setIsCreateDialogOpen(false);
      setNewSubscriptionName("");
      setNewKeywords("");
      setNewIndications("");
      refetch();
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    }
  });

  const updateMutation = trpc.subscriptions.update.useMutation({
    onSuccess: () => {
      toast.success("订阅更新成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    }
  });

  const deleteMutation = trpc.subscriptions.delete.useMutation({
    onSuccess: () => {
      toast.success("订阅已删除");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    }
  });

  const handleCreate = () => {
    if (!newSubscriptionName.trim()) {
      toast.error("请输入订阅名称");
      return;
    }

    const keywords = newKeywords.split(',').map(k => k.trim()).filter(k => k);
    const indications = newIndications.split(',').map(i => i.trim()).filter(i => i);

    createMutation.mutate({
      subscriptionName: newSubscriptionName,
      keywords: keywords.length > 0 ? keywords : undefined,
      indications: indications.length > 0 ? indications : undefined,
      emailNotification: newEmailEnabled
    });
  };

  const handleToggleNotification = (subscriptionId: number, enabled: boolean) => {
    updateMutation.mutate({
      subscriptionId,
      notificationEnabled: enabled
    });
  };

  const handleDelete = (subscriptionId: number) => {
    if (confirm("确定要删除这个订阅吗？")) {
      deleteMutation.mutate({ subscriptionId });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">登录后可管理订阅</p>
            <a href={getLoginUrl()}>
              <Button>登录</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">我的订阅</h1>
            <p className="text-muted-foreground">管理您的临床试验订阅通知</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                创建订阅
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新订阅</DialogTitle>
                <DialogDescription>
                  设置订阅条件，当有符合条件的新试验发布时，您将收到通知
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">订阅名称 *</Label>
                  <Input
                    id="name"
                    placeholder="例如：心血管疾病 Phase III 试验"
                    value={newSubscriptionName}
                    onChange={(e) => setNewSubscriptionName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">关键词</Label>
                  <Input
                    id="keywords"
                    placeholder="多个关键词用逗号分隔"
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    例如：心肌梗死, 冠心病, 心血管
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indications">适应症</Label>
                  <Input
                    id="indications"
                    placeholder="多个适应症用逗号分隔"
                    value={newIndications}
                    onChange={(e) => setNewIndications(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    例如：糖尿病, 高血压
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notification">邮件通知</Label>
                    <p className="text-xs text-muted-foreground">
                      通过邮件接收新试验通知
                    </p>
                  </div>
                  <Switch
                    id="email-notification"
                    checked={newEmailEnabled}
                    onCheckedChange={setNewEmailEnabled}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "创建中..." : "创建"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : subscriptions && subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const keywords = sub.keywords ? JSON.parse(sub.keywords) : [];
              const indications = sub.indications ? JSON.parse(sub.indications) : [];
              const phases = sub.trialPhases ? JSON.parse(sub.trialPhases) : [];
              const journals = sub.journals ? JSON.parse(sub.journals) : [];

              return (
                <Card key={sub.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{sub.subscriptionName}</CardTitle>
                          {sub.notificationEnabled ? (
                            <Badge variant="default" className="gap-1">
                              <Bell className="w-3 h-3" />
                              已启用
                            </Badge>
                          ) : (
                            <Badge variant="outline">已禁用</Badge>
                          )}
                          {sub.emailNotification === 1 && (
                            <Badge variant="secondary" className="gap-1">
                              <Mail className="w-3 h-3" />
                              邮件
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          创建于 {new Date(sub.createdAt).toLocaleDateString('zh-CN')}
                        </CardDescription>
                      </div>

                      <div className="flex gap-2">
                        <Switch
                          checked={sub.notificationEnabled === 1}
                          onCheckedChange={(checked) => handleToggleNotification(sub.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(sub.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {keywords.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-2">关键词</div>
                          <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword: string, idx: number) => (
                              <Badge key={idx} variant="outline">{keyword}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {indications.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-2">适应症</div>
                          <div className="flex flex-wrap gap-2">
                            {indications.map((indication: string, idx: number) => (
                              <Badge key={idx} variant="outline">{indication}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {phases.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-2">试验阶段</div>
                          <div className="flex flex-wrap gap-2">
                            {phases.map((phase: string, idx: number) => (
                              <Badge key={idx} variant="secondary">Phase {phase}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {journals.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-2">期刊</div>
                          <div className="flex flex-wrap gap-2">
                            {journals.map((journal: string, idx: number) => (
                              <Badge key={idx} variant="outline">{journal}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {keywords.length === 0 && indications.length === 0 && phases.length === 0 && journals.length === 0 && (
                        <p className="text-sm text-muted-foreground">未设置筛选条件，将接收所有新试验通知</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">您还没有创建任何订阅</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建第一个订阅
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
