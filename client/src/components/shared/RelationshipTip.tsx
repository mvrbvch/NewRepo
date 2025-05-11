
import React from 'react';
import { Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RelationshipTipProps {
  title: string;
  description: string;
}

const RelationshipTip = ({ title, description }: RelationshipTipProps) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-love fill-love" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          
          <Button variant="ghost" size="sm">
            Explorar dicas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

export default RelationshipTip;
