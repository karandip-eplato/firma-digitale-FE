import CssBaseline from '@material-ui/core/CssBaseline';
import {createMuiTheme} from '@material-ui/core/styles';
import {ThemeProvider} from '@material-ui/styles';
import React from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import './App.css';
import AppBar from './AppBar';
import {LinearProgress, Grid, Typography} from '@material-ui/core';
import Document from './Document';
import {connect} from 'react-redux';
import axios from 'axios';
import {showAppbar} from '../actions';

const theme = createMuiTheme({
    palette: {
        primary: {main: '#d8d8d8'}, // Purple and green play nicely together.
        secondary: {main: '#f0c030'} // This is just green.A700 as hex.
    }
});

class App extends React.Component {
    state = {
        progress: true,
        payload: {
            noOfSigners: 0,
            signerNames: [],
            signatures: [],
            noOfDocuments: 1,
            fileName: '',
            dpi: 0,
            signatureDimensions: [],
            showDocument: true,
            defaultSignatureBase64: '',
            totalPages: 0,
            defaultHeight: 0,
            defaultWidth: 0,
            scaleFor72DPI: 0,
        }
    };

    constructor(props) {
        super(props);
        window.onbeforeunload = function(e) {
            const obj = {
                tabClosed: true
            };
            window.parent.postMessage(obj, '*');
            console.log('Post message di chiusura inviato');
           return "Post message di chiusira inviato";
        };
        // console.log('pippo');
        // window.addEventListener("unload", function logData() {
        //
        // });
    }
    signatures = [];
    static rerenderDocument = null;
    imageToDataUri = (img, index, width, height) => {
        // create an off-screen canvas
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        // set its dimension to target size
        canvas.width = width;
        canvas.height = height;
        var image = new Image();
        image.src = img;
        image.onload = () => {
            ctx.drawImage(image, 0, 0, width, height);
            this.signatures[index] = canvas.toDataURL();
        };
        // draw source image into the off-screen canvas:
        // encode image to data-uri with base64 version of compressed image
    };
    receiveMessage = event => {
        // const base64Reactangle = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSIxODBweCIgaGVpZ2h0PSI1MHB4IiB2aWV3Qm94PSIwIDAgMTgwIDUwIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAxODAgNTAiIHhtbDpzcGFjZT0icHJlc2VydmUiPiAgPGltYWdlIGlkPSJpbWFnZTAiIHdpZHRoPSIxODAiIGhlaWdodD0iNTAiIHg9IjAiIHk9IjAiCiAgICBocmVmPSJkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUxRQUFBQXlBUU1BQUFEUDZtTzBBQUFBQkdkQlRVRUFBTEdQQy94aEJRQUFBQ0JqU0ZKTgpBQUI2SmdBQWdJUUFBUG9BQUFDQTZBQUFkVEFBQU9wZ0FBQTZtQUFBRjNDY3VsRThBQUFBQmxCTVZFWC9VZ0QvLy84RHpxaTZBQUFBCkFXSkxSMFFCL3dJdDNnQUFBQWQwU1UxRkIrTU1CaGNERG1sanVtQUFBQUFTU1VSQlZEakxZMkFZQmFOZ0ZJeUNvUUVBQkxBQUFSWVQKTjlBQUFBQWxkRVZZZEdSaGRHVTZZM0psWVhSbEFESXdNVGt0TVRJdE1EZFVNRFk2TURNNk1UUXRNRGM2TURBQWdVTTZBQUFBSlhSRgpXSFJrWVhSbE9tMXZaR2xtZVFBeU1ERTVMVEV5TFRBM1ZEQTJPakF6T2pFMExUQTNPakF3Y2R6N2hnQUFBQmwwUlZoMFUyOW1kSGRoCmNtVUFRV1J2WW1VZ1NXMWhaMlZTWldGa2VYSEpaVHdBQUFBQVNVVk9SSzVDWUlJPSIgLz4KPC9zdmc+Cg==';
        const data = event.data;
        if (typeof data === 'object') {
            const request = {
                documentId: data.documentId,
                timestamp: data.timestamp,
                token: data.token,
                userId: data.userId,
                className: data.className
            };
            axios
                .post('http://localhost:8220/auth', request)
                .then(res => {
                    const signerNames = [];
                    let counter = 0;
                    const signatureDimensions = [];
                    data.signers.forEach((element, index) => {
                        signerNames.push(element.name);
                        if (element.signature && element.height && element.width) {
                            this.imageToDataUri(
                                'data:image/png;base64, ' + element.signature,
                                index,
                                (element.width * res.data.scaleFor72DPI),
                                (element.height * res.data.scaleFor72DPI)
                            );
                            signatureDimensions.push({
                                height: element.height * res.data.scaleFor72DPI,
                                width: element.width * res.data.scaleFor72DPI
                            });
                        } else if (element.signature) {
                            this.imageToDataUri(
                                'data:image/png;base64, ' + element.signature,
                                index,
                                (res.data.defaultWidth * res.data.scaleFor72DPI),
                                (res.data.defaultHeight * res.data.scaleFor72DPI)
                            );
                            signatureDimensions.push({
                                height: res.data.defaultHeight * res.data.scaleFor72DPI,
                                width: res.data.defaultWidth * res.data.scaleFor72DPI
                            });
                        } else if (element.width && element.height) {
                            this.imageToDataUri(
                                res.data.defaultSignatureBase64,
                                index,
                                element.width * res.data.scaleFor72DPI,
                                element.height * res.data.scaleFor72DPI
                            );
                            signatureDimensions.push({
                                height: element.height * res.data.scaleFor72DPI,
                                width: element.width * res.data.scaleFor72DPI
                            });
                            // this.signatures[index] = counter;
                            // counter = counter + 1;
                        } else {
                            this.imageToDataUri(
                                res.data.defaultSignatureBase64,
                                index,
                                res.data.defaultWidth * res.data.scaleFor72DPI,
                                res.data.defaultHeight * res.data.scaleFor72DPI
                            );
                            signatureDimensions.push({
                                height: res.data.defaultHeight * res.data.scaleFor72DPI,
                                width: res.data.defaultWidth * res.data.scaleFor72DPI
                            });
                            // this.signatures[index] = counter;
                            // counter = counter + 1;
                        }
                    });
                    setTimeout(() => {
                        const payload = {
                            noOfSigners: data.signers.length,
                            signerNames: signerNames,
                            signatures: this.signatures,
                            noOfDocuments: res.data.totalPages,
                            fileName: res.data.filename,
                            dpi: res.data.dpi,
                            signatureDimensions: signatureDimensions,
                            base64Reactangle: res.data.defaultSignatureBase64,
                            defaultHeight: res.data.defaultHeight,
                            defaultWidth: res.data.defaultHeight,
                            scaleFor72DPI: res.data.scaleFor72DPI
                        };

                        this.setState({
                            payload: payload,
                            progress: false,
                            showDocument: true
                        });
                    }, 2000);
                })
                .catch(err => {
                    this.setState({progress: false, showDocument: false});
                    this.props.dispatch(showAppbar(false));
                });
        } else if (typeof data === 'number') {
            switch (data) {
                case 37: // left
                    document.getElementById('prevPage') &&
                    document.getElementById('prevPage').click();
                    break;

                case 38: // up
                    window.scrollBy(0, -40);
                    break;

                case 39: // right
                    document.getElementById('nextPage') &&
                    document.getElementById('nextPage').click();
                    break;

                case 40: // down
                    window.scrollBy(0, 40);
                    break;

                default:
                    return; // exit this handler for other keys
            }
        }
    };

    componentDidMount = () => {
        this.setState({progress: true});
        window.addEventListener('message', this.receiveMessage, false);
        window.parent.postMessage(true, '*');
        document.onkeydown = function (e) {
            e = e || window.event;
            switch (e.which || e.keyCode) {
                case 37: // left
                    document.getElementById('prevPage') &&
                    document.getElementById('prevPage').click();
                    e.preventDefault(); // prevent the default action (scroll / move caret)
                    break;

                case 38: // up
                    window.scrollBy(0, -40);
                    e.preventDefault(); // prevent the default action (scroll / move caret)
                    break;

                case 39: // right
                    document.getElementById('nextPage') &&
                    document.getElementById('nextPage').click();
                    e.preventDefault(); // prevent the default action (scroll / move caret)
                    break;

                case 40: // down
                    window.scrollBy(0, 40);
                    e.preventDefault(); // prevent the default action (scroll / move caret)
                    break;

                default:
                    return; // exit this handler for other keys
            }
        };
    };

    render() {
        return (
            <React.Fragment>
                {this.state.progress ? (
                    <LinearProgress/>
                ) : (
                    <React.Fragment>
                        <CssBaseline/>
                        <Router>
                            <ThemeProvider theme={theme}>
                                <Switch>
                                    <Route
                                        path="/**"
                                        component={() => {
                                            return (
                                                <React.Fragment>
                                                    <AppBar/>
                                                    {this.state.showDocument ? (
                                                        <Document payload={this.state.payload}/>
                                                    ) : (
                                                        <React.Fragment>
                                                            <Grid container>
                                                                <Grid
                                                                    container
                                                                    item
                                                                    xs={12}
                                                                    justify="center"
                                                                    alignContent="center"
                                                                    alignItems="center"
                                                                >
                                                                    <Typography
                                                                        variant="h4"
                                                                        style={{color: 'red', marginTop: '5%'}}
                                                                    >
                                                                        Autenticazione fallita
                                                                    </Typography>
                                                                </Grid>
                                                            </Grid>
                                                        </React.Fragment>
                                                    )}
                                                </React.Fragment>
                                            );
                                        }}
                                    />
                                </Switch>
                            </ThemeProvider>
                        </Router>
                    </React.Fragment>
                )}
            </React.Fragment>
        );
    }
}

export default connect()(App);
