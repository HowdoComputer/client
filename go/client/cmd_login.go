package main

import (
	"errors"

	"github.com/codegangsta/cli"
	"github.com/keybase/client/go/engine"
	"github.com/keybase/client/go/libcmdline"
	"github.com/keybase/client/go/libkb"
	keybase_1 "github.com/keybase/client/protocol/go"
	"github.com/maxtaco/go-framed-msgpack-rpc/rpc2"
)

type CmdLogin struct {
	Username string
}

func NewLoginUIProtocol() rpc2.Protocol {
	return keybase_1.LoginUiProtocol(G_UI.GetLoginUI())
}

func NewDoctorUIProtocol() rpc2.Protocol {
	return keybase_1.DoctorUiProtocol(G_UI.GetDoctorUI())
}

func (v *CmdLogin) RunClient() (err error) {
	var cli keybase_1.LoginClient
	protocols := []rpc2.Protocol{
		NewLoginUIProtocol(),
		NewLogUIProtocol(),
		NewSecretUIProtocol(),
		NewDoctorUIProtocol(),
	}
	if cli, err = GetLoginClient(); err != nil {
	} else if err = RegisterProtocols(protocols); err != nil {
	} else {
		arg := keybase_1.PassphraseLoginArg{Username: v.Username}
		err = cli.PassphraseLogin(arg)
	}
	return
}

func (v *CmdLogin) Run() error {
	ctx := &engine.Context{
		LogUI:         G.UI.GetLogUI(),
		LoginUI:       G.UI.GetLoginUI(),
		DoctorUI:      G.UI.GetDoctorUI(),
		GPGUI:         G.UI.GetGPGUI(),
		SecretUI:      G.UI.GetSecretUI(),
		GlobalContext: G,
	}
	arg := engine.LoginEngineArg{
		Login: libkb.LoginArg{
			Prompt:   true,
			Retry:    3,
			Username: v.Username,
		},
	}
	li := engine.NewLoginEngine(&arg)
	return engine.RunEngine(li, ctx)
}

func NewCmdLogin(cl *libcmdline.CommandLine) cli.Command {
	return cli.Command{
		Name: "login",
		Usage: "Establish a session with the keybase server " +
			"(if necessary)",
		Action: func(c *cli.Context) {
			cl.ChooseCommand(&CmdLogin{}, "login", c)
		},
	}
}

func (c *CmdLogin) ParseArgv(ctx *cli.Context) (err error) {
	nargs := len(ctx.Args())
	if nargs > 1 {
		err = errors.New("login takes 0 or 1 argument: [<username>]")
	} else if nargs == 1 {
		c.Username = ctx.Args()[0]
	}
	return err
}

func (v *CmdLogin) GetUsage() libkb.Usage {
	return libkb.Usage{
		Config:     true,
		GpgKeyring: false,
		KbKeyring:  true,
		API:        true,
		Terminal:   true,
	}
}
