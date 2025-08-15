              message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <Avatar className="h-10 w-10">
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
         {isPending && (
           <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
            <div className="max-w-lg p-4 rounded-xl bg-muted flex items-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary"/>
            </div>
           </div>
        )}
      </div>

       {state.error && (
        <div className="p-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 bg-background border-t">
        <form ref={formRef} action={handleFormAction} className="flex items-center gap-2">
          <Input
            type="text"
            name="message"
            placeholder="Ask anything..."
            className="flex-1"
            disabled={isPending}
            autoComplete="off"
          />
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}