import {
    Button,
    Divider,
    Grid,
    LinearProgress,
    List,
    ListItem,
    SwipeableDrawer,
    Typography
} from '@material-ui/core';
import {withStyles} from '@material-ui/styles';
import axios from 'axios';
import mergeImages from 'merge-images';
import React from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import {connect} from 'react-redux';
import {
    setDocumentIndex,
    setNumberOfDocuments,
    setOutput,
    setSignatureIndex,
    showAppbar
} from '../actions';
import App from './App';
import $ from 'jquery';

const styles = {
    list: {
        width: 250
    },
    fullList: {
        width: 'auto'
    }
};

class Document extends React.Component {

    componentWillUnmount = () => {
        const obj = {
            tabClosed: true
        };
        window.parent.postMessage(obj, '*');
    };
    state = {};
    constructor(props) {
        super(props);
        // document.getElementById().onmousemove(e) =>
        this.state = {
            signerNames: props.payload.signerNames,
            signatures: JSON.stringify(props.payload.signatures),
            defaultSignature: props.payload.defaultSignature,
            noOfDocuments: props.payload.noOfDocuments,
            noOfSigners: props.payload.noOfSigners,
            documentData: null,
            signatureData: null,
            progress: false,
            x: 0,
            y: 0,
            signerMode: true,
            outputCoordinates: null,
            signatureDataArray: props.payload.signatures,
            name: 'Cursor',
            showCursor: false,
            right: false,
            fileName: props.payload.fileName,
            dpi: props.payload.dpi,
            signatureDimensions: props.payload.signatureDimensions,
            scaleFor72DPI: props.payload.scaleFor72DPI,
            showSignaturePreview: false,
            previewX: 0,
            previewY: 0
        };
    }


    documents = [];
    defaultSignatures = [];
    nextSignerIndex = 1;
    originalDocument = null;

    placeSignatureOnImageWithoutMerging(e) {
        this.setState({
            showSignaturePreview: true,
            previewX: e.clientX + 'px',
            previewY: e.clientY + 'px',
        })
    }

    // Metodo che viene chiamato quando clicco per depositare la firma
    _onMouseMove(e) {
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;
        if (this.state.signerMode === true) {
            const imgWidth = document.getElementById('document').width;
            const imgHeight = document.getElementById('document').height;
            console.log('Document height in 300 dpi: ', this.state.originalHeight);
            console.log('Document width in 300 dpi: ', this.state.originalWidth);
            console.log('Scale: ', this.state.scaleFor72DPI);
            console.log('Document height in 72 dpi: ', this.state.originalHeight / this.state.scaleFor72DPI);
            console.log('Document width in 72 dpi: ', this.state.originalWidth / this.state.scaleFor72DPI);
            const mergeData = [];
            this.props.Output.forEach(element => {
                if (element) {
                    const index = this.state.signerNames.indexOf(element.user);
                    if (
                        this.props.DocumentIndex === element.coordinates.pageNo - 1 &&
                        element.user !== this.state.signerNames[this.props.SignatureIndex]
                    )
                        mergeData.push({
                            src: this.state.signatureDataArray[index],
                            x: element.coordinates.x,
                            y: element.coordinates.y,
                            imgHeight: element.coordinates.originalHeight
                        });
                }
            });
            console.log('signature data: ', this.state.signatureData);

            mergeImages([
                {
                    src: this.originalDocument,
                    x: 0,
                    y: 0
                },
                ...mergeData,
                {
                    src: this.state.signatureData,
                    x: x * (this.state.originalWidth / imgWidth),
                    y: y * (this.state.originalHeight / imgHeight)
                }
            ]).then(b64 => {
                let outputCoordinates = this.state.outputCoordinates;
                outputCoordinates = {
                    pageNo: this.props.DocumentIndex + 1,
                    x: x * (this.state.originalWidth / imgWidth),
                    // y: y * (this.state.originalHeight / imgHeight) + parseInt(this.state.originalSignHeight)
                    y: y * (this.state.originalHeight / imgHeight),
                    originalHeight: parseInt(this.state.originalSignHeight)
                };

                this.props.dispatch(
                    setOutput(
                        {
                            user: this.state.signerNames[this.props.SignatureIndex],
                            coordinates: outputCoordinates
                        },
                        this.props.SignatureIndex
                    )
                );
                this.setState({
                    x: x,
                    y: (y + parseInt(this.state.originalSignHeight)),
                    documentData: b64,
                    outputCoordinates: outputCoordinates,
                    signerMode: false,
                    heightIn72Dpi: this.state.originalHeight / this.state.scaleFor72DPI,
                    widthIn72Dpi: this.state.originalWidth / this.state.scaleFor72DPI
                });
                console.log('Document height in 72 dpi in state: ', this.state.heightIn72Dpi);
                console.log('Document width in 72 dpi in state: ', this.state.widthIn72Dpi);
            });
        }
    }

    zoom = () => {
        var myImg = document.getElementById('document');
        if (myImg && this.props.ZoomValue !== null) {
            myImg.style.width = this.props.ZoomValue + 'px';
        }
        // this.rerender();
        return true;
    };
    toggleDrawer = (side, open) => event => {
        if (
            event &&
            event.type === 'keydown' &&
            (event.key === 'Tab' || event.key === 'Shift')
        ) {
            return;
        }
        this.setState({[side]: open});
    };
    sideList = side => (
        <div
            className={this.props.classes.list}
            role="presentation"
            onClick={this.toggleDrawer(side, false)}
            onKeyDown={this.toggleDrawer(side, false)}
        >
            <List>
                <ListItem>
                    <Typography
                        style={{textAlign: 'center', width: '100%', fontWeight: 'bold'}}
                    >
                        Seleziona l'immagine di firma da eliminare
                    </Typography>
                </ListItem>
                <Divider/>
                {this.props.Output.filter(element => {
                    if (element) {
                        return true;
                    } else {
                        return false;
                    }
                }).map((element, key) => {
                    const index = this.state.signerNames.indexOf(element.user);
                    return (
                        <React.Fragment key={key}>
                            <ListItem
                                button
                                onClick={() => {
                                    this.props.dispatch(setOutput(undefined, index));
                                    if (index === this.props.SignatureIndex) {
                                        this.setState({signerMode: true});
                                    }
                                    setTimeout(() => {
                                        this.getDocument();
                                    }, 100);
                                }}
                            >
                                <Grid container>
                                    <Grid
                                        item
                                        container
                                        xs={12}
                                        justify="center"
                                        alignContent="center"
                                        alignItems="center"
                                    >
                                        <img style={{
                                            width: '70px',
                                            height: '70px'
                                        }}
                                             src={this.state.signatureDataArray[index]}
                                             alt={element.user}
                                        />
                                    </Grid>
                                    <Grid
                                        item
                                        container
                                        xs={12}
                                        justify="center"
                                        alignContent="center"
                                        alignItems="center"
                                    >
                                        <Typography noWrap>{element.user}</Typography>
                                    </Grid>
                                </Grid>
                            </ListItem>
                            <Divider/>
                        </React.Fragment>
                    );
                })}
            </List>
        </div>
    );
    componentDidMount = () => {
        this.getDocument();
        document.getElementById('mainBody').onresize = () => {
            this.rerender();
        };
        App.rerenderDocument = this.rerender;
        // setTimeout(() => {
        //     $(function() {
        //         $("#pippo")
        //             .mousemove(function(e) {
        //                 $(".cursor")
        //                     .show()
        //                     .css({
        //                         left: e.clientX,
        //                         top: e.clientY + $("#testarea").scrollTop(),
        //                         display: "block"
        //                     });
        //             })
        //             .mouseout(function(event) {
        //                 $(".cursor").hide();
        //             });
        //     });
        // }, 2000);
    };
    getDocument = () => {
        let currentDocumentIndex = this.props.DocumentIndex;
        this.props.dispatch(showAppbar(2));
        this.setState({progress: true, showCursor: false});
        if (this.documents[currentDocumentIndex]) {
            const resDocument = this.documents[currentDocumentIndex];
            let signatureFile = JSON.parse(this.state.signatures)[
                this.props.SignatureIndex
                ];

            if (
                typeof JSON.parse(this.state.signatures)[this.props.SignatureIndex] ===
                'number'
            ) {
                axios
                    .get(
                        '/Rectangle/' +
                        this.state.defaultSignature[signatureFile],
                        {
                            responseType: 'blob'
                        }
                    )
                    .then(resSignData => {
                        var urlCreator = window.URL || window.webkitURL;
                        this.props.dispatch(setNumberOfDocuments(this.state.noOfDocuments));
                        const img = document.createElement('img');
                        img.src = urlCreator.createObjectURL(resDocument.data);
                        img.onload = () => {
                            this.setState({
                                originalWidth: img.width,
                                originalHeight: img.height
                            });
                        };
                        const imgSign = document.createElement('img');
                        imgSign.src = urlCreator.createObjectURL(resSignData.data);
                        imgSign.onload = () => {
                            this.setState({
                                originalSignWidth: imgSign.width,
                                originalSignHeight: imgSign.height
                            });
                        };
                        const signatureDataArray = this.state.signatureDataArray;
                        signatureDataArray[
                            this.props.SignatureIndex
                            ] = urlCreator.createObjectURL(resSignData.data);
                        let documentData = urlCreator.createObjectURL(resDocument.data);
                        this.originalDocument = documentData;
                        if (this.props.Output.length > 0) {
                            const mergeData = [];
                            this.props.Output.forEach(element => {
                                if (element) {
                                    const index = this.state.signerNames.indexOf(element.user);
                                    if (currentDocumentIndex === element.coordinates.pageNo - 1)
                                        mergeData.push({
                                            src: signatureDataArray[index],
                                            x: element.coordinates.x,
                                            y: element.coordinates.y
                                        });
                                }
                            });
                            mergeImages([
                                {
                                    src: documentData,
                                    x: 0,
                                    y: 0
                                },
                                ...mergeData
                            ]).then(b64 => {
                                documentData = b64;
                                this.props.dispatch(showAppbar(1));
                                this.setState({
                                    documentData: documentData,
                                    signatureData: urlCreator.createObjectURL(resSignData.data),
                                    progress: false,
                                    signatureDataArray: signatureDataArray
                                });
                                this.rerender();
                            });
                        } else {
                            this.props.dispatch(showAppbar(1));
                            this.setState({
                                documentData: documentData,
                                signatureData: urlCreator.createObjectURL(resSignData.data),
                                progress: false,
                                signatureDataArray: signatureDataArray
                            });
                            this.rerender();
                        }
                    });
            } else {
                let resSignData = signatureFile;
                var urlCreator = window.URL || window.webkitURL;
                this.props.dispatch(setNumberOfDocuments(this.state.noOfDocuments));
                const img = document.createElement('img');
                img.src = urlCreator.createObjectURL(resDocument.data);
                img.onload = () => {
                    this.setState({
                        originalWidth: img.width,
                        originalHeight: img.height
                    });
                };

                this.setState({
                    originalSignWidth: this.state.signatureDimensions[
                        this.props.SignatureIndex
                        ].width,
                    originalSignHeight: this.state.signatureDimensions[
                        this.props.SignatureIndex
                        ].height
                });

                const signatureDataArray = this.state.signatureDataArray;
                signatureDataArray[this.props.SignatureIndex] = resSignData;
                let documentData = urlCreator.createObjectURL(resDocument.data);
                this.originalDocument = documentData;
                if (this.props.Output.length > 0) {
                    const mergeData = [];
                    this.props.Output.forEach(element => {
                        if (element) {
                            const index = this.state.signerNames.indexOf(element.user);
                            if (currentDocumentIndex === element.coordinates.pageNo - 1)
                                mergeData.push({
                                    src: signatureDataArray[index],
                                    x: element.coordinates.x,
                                    y: element.coordinates.y
                                });
                        }
                    });
                    mergeImages([
                        {
                            src: documentData,
                            x: 0,
                            y: 0
                        },
                        ...mergeData
                    ]).then(b64 => {
                        documentData = b64;
                        this.props.dispatch(showAppbar(1));
                        this.setState({
                            documentData: documentData,
                            signatureData: resSignData,
                            progress: false,
                            signatureDataArray: signatureDataArray
                        });
                        this.rerender();
                    });
                } else {
                    this.props.dispatch(showAppbar(1));
                    this.setState({
                        documentData: documentData,
                        signatureData: resSignData,
                        progress: false,
                        signatureDataArray: signatureDataArray
                    });
                    this.rerender();
                }
            }
        } else {
            axios
                .get(
                    'http://localhost:8220/getImage?pdfName=' +
                    this.state.fileName +
                    '&pageNumber=' +
                    currentDocumentIndex,
                    {responseType: 'blob'}
                )
                .then(resDocument => {
                    this.documents[currentDocumentIndex] = resDocument;
                    let signatureFile = JSON.parse(this.state.signatures)[
                        this.props.SignatureIndex
                        ];
                    if (
                        typeof JSON.parse(this.state.signatures)[
                            this.props.SignatureIndex
                            ] === 'number'
                    ) {
                        if (this.defaultSignatures[signatureFile]) {
                            const resSignData = this.defaultSignatures[signatureFile];
                            var urlCreator = window.URL || window.webkitURL;
                            this.props.dispatch(
                                setNumberOfDocuments(this.state.noOfDocuments)
                            );
                            const img = document.createElement('img');
                            img.src = urlCreator.createObjectURL(resDocument.data);
                            img.onload = () => {
                                this.setState({
                                    originalWidth: img.width,
                                    originalHeight: img.height
                                });
                            };
                            const imgSign = document.createElement('img');
                            imgSign.src = urlCreator.createObjectURL(resSignData.data);
                            imgSign.onload = () => {
                                this.setState({
                                    originalSignWidth: imgSign.width,
                                    originalSignHeight: imgSign.height
                                });
                            };
                            const signatureDataArray = this.state.signatureDataArray;
                            signatureDataArray[
                                this.props.SignatureIndex
                                ] = urlCreator.createObjectURL(resSignData.data);
                            let documentData = urlCreator.createObjectURL(resDocument.data);
                            this.originalDocument = documentData;
                            if (this.props.Output.length > 0) {
                                const mergeData = [];
                                this.props.Output.forEach(element => {
                                    if (element) {
                                        const index = this.state.signerNames.indexOf(element.user);
                                        if (currentDocumentIndex === element.coordinates.pageNo - 1)
                                            mergeData.push({
                                                src: signatureDataArray[index],
                                                x: element.coordinates.x,
                                                y: element.coordinates.y
                                            });
                                    }
                                });
                                mergeImages([
                                    {
                                        src: documentData,
                                        x: 0,
                                        y: 0
                                    },
                                    ...mergeData
                                ]).then(b64 => {
                                    documentData = b64;
                                    this.props.dispatch(showAppbar(1));
                                    this.setState({
                                        documentData: documentData,
                                        signatureData: urlCreator.createObjectURL(resSignData.data),
                                        progress: false,
                                        signatureDataArray: signatureDataArray
                                    });
                                    this.rerender();
                                });
                            } else {
                                this.props.dispatch(showAppbar(1));
                                this.setState({
                                    documentData: documentData,
                                    signatureData: urlCreator.createObjectURL(resSignData.data),
                                    progress: false,
                                    signatureDataArray: signatureDataArray
                                });
                                this.rerender();
                            }
                        } else {
                            axios
                                .get(
                                    '/Rectangle/' +
                                    this.state.defaultSignature[signatureFile],
                                    {
                                        responseType: 'blob'
                                    }
                                )
                                .then(resSignData => {
                                    var urlCreator = window.URL || window.webkitURL;
                                    this.props.dispatch(
                                        setNumberOfDocuments(this.state.noOfDocuments)
                                    );
                                    const img = document.createElement('img');
                                    img.src = urlCreator.createObjectURL(resDocument.data);
                                    img.onload = () => {
                                        this.setState({
                                            originalWidth: img.width,
                                            originalHeight: img.height
                                        });
                                    };
                                    const imgSign = document.createElement('img');
                                    imgSign.src = urlCreator.createObjectURL(resSignData.data);
                                    imgSign.onload = () => {
                                        this.setState({
                                            originalSignWidth: imgSign.width,
                                            originalSignHeight: imgSign.height
                                        });
                                    };
                                    const signatureDataArray = this.state.signatureDataArray;
                                    signatureDataArray[
                                        this.props.SignatureIndex
                                        ] = urlCreator.createObjectURL(resSignData.data);
                                    let documentData = urlCreator.createObjectURL(
                                        resDocument.data
                                    );
                                    this.originalDocument = documentData;
                                    if (this.props.Output.length > 0) {
                                        const mergeData = [];
                                        this.props.Output.forEach(element => {
                                            if (element) {
                                                const index = this.state.signerNames.indexOf(
                                                    element.user
                                                );
                                                if (
                                                    currentDocumentIndex ===
                                                    element.coordinates.pageNo - 1
                                                )
                                                    mergeData.push({
                                                        src: signatureDataArray[index],
                                                        x: element.coordinates.x,
                                                        y: element.coordinates.y
                                                    });
                                            }
                                        });
                                        mergeImages([
                                            {
                                                src: documentData,
                                                x: 0,
                                                y: 0
                                            },
                                            ...mergeData
                                        ]).then(b64 => {
                                            documentData = b64;
                                            this.props.dispatch(showAppbar(1));
                                            this.setState({
                                                documentData: documentData,
                                                signatureData: urlCreator.createObjectURL(
                                                    resSignData.data
                                                ),
                                                progress: false,
                                                signatureDataArray: signatureDataArray
                                            });
                                            this.rerender();
                                        });
                                    } else {
                                        this.props.dispatch(showAppbar(1));
                                        this.setState({
                                            documentData: documentData,
                                            signatureData: urlCreator.createObjectURL(
                                                resSignData.data
                                            ),
                                            progress: false,
                                            signatureDataArray: signatureDataArray
                                        });
                                        this.rerender();
                                    }
                                });
                        }
                    } else {
                        let resSignData = signatureFile;
                        urlCreator = window.URL || window.webkitURL;
                        this.props.dispatch(setNumberOfDocuments(this.state.noOfDocuments));
                        const img = document.createElement('img');
                        img.src = urlCreator.createObjectURL(resDocument.data);
                        img.onload = () => {
                            this.setState({
                                originalWidth: img.width,
                                originalHeight: img.height
                            });
                        };

                        this.setState({
                            originalSignWidth: this.state.signatureDimensions[
                                this.props.SignatureIndex
                                ].width,
                            originalSignHeight: this.state.signatureDimensions[
                                this.props.SignatureIndex
                                ].height
                        });

                        const signatureDataArray = this.state.signatureDataArray;
                        signatureDataArray[this.props.SignatureIndex] = resSignData;
                        let documentData = urlCreator.createObjectURL(resDocument.data);
                        this.originalDocument = documentData;
                        if (this.props.Output.length > 0) {
                            const mergeData = [];
                            this.props.Output.forEach(element => {
                                if (element) {
                                    const index = this.state.signerNames.indexOf(element.user);
                                    if (currentDocumentIndex === element.coordinates.pageNo - 1)
                                        mergeData.push({
                                            src: signatureDataArray[index],
                                            x: element.coordinates.x,
                                            y: element.coordinates.y
                                        });
                                }
                            });
                            mergeImages([
                                {
                                    src: documentData,
                                    x: 0,
                                    y: 0
                                },
                                ...mergeData
                            ]).then(b64 => {
                                documentData = b64;
                                this.props.dispatch(showAppbar(1));
                                this.setState({
                                    documentData: documentData,
                                    signatureData: resSignData,
                                    progress: false,
                                    signatureDataArray: signatureDataArray
                                });
                                this.rerender();
                            });
                        } else {
                            this.props.dispatch(showAppbar(1));
                            this.setState({
                                documentData: documentData,
                                signatureData: resSignData,
                                progress: false,
                                signatureDataArray: signatureDataArray
                            });
                            this.rerender();
                        }
                    }
                });
        }
    };
    rerender = () => {
        this.forceUpdate();
    };

    componentDidUpdate(prevProps) {
        if (
            prevProps.DocumentIndex !== this.props.DocumentIndex ||
            prevProps.SignatureIndex !== this.props.SignatureIndex
        ) {
            this.getDocument();
        }
    }

    post = () => {
        const output = [];
        console.log('Original height: ', this.state.originalHeight);
        this.props.Output.forEach(element => {
            if (element) {
                const coordinateY = (this.state.originalHeight - (((element.coordinates.y + element.coordinates.originalHeight) * this.state.dpi) / this.state.dpi)) / this.state.scaleFor72DPI;
                const coordinateX = ((element.coordinates.x * this.state.dpi) / this.state.dpi) / this.state.scaleFor72DPI;
                console.log('Element coordinate y: ', coordinateY);
                console.log('Element coordinate x: ', coordinateX);
                const tempCoordinates = {
                    pageNo: element.coordinates.pageNo,
                    x: coordinateX >= 0 ? coordinateX : 0,
                    y: coordinateY >= 0 ? coordinateY : 0
                };
                const temp = {
                    user: element.user,
                    coordinates: tempCoordinates
                };
                output.push(temp);
            } else {
                output.push(null);
            }
        });
        window.parent.postMessage(output, '*');
        // this.componentDidUnmount();
        axios.get(
            '/cleanUp?pdfName=' +
            this.state.fileName +
            '&totalPages=' +
            this.props.NoOfDocuments
        ).then(
            () => {
                this.componentWillUnmount();
                window.onbeforeunload = null;
                window.close();
            }
        );
        return true;
    };

    render() {
        let index = 0;
        for (
            let i = (this.props.SignatureIndex + 1) % this.state.noOfSigners;
            i < this.state.noOfSigners;
            ++i
        ) {
            if (!this.props.Output[i]) {
                index = i;
                break;
            }
        }
        this.nextSignerIndex = index % this.state.noOfSigners;
        let NoOfSigns = 0;
        this.props.Output.forEach(element => {
            if (element) {
                NoOfSigns = NoOfSigns + 1;
            }
        });
        if (this.state.text) {
            this.post();
            this.props.dispatch(showAppbar(0));
            return (
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
                                style={{color: 'green', marginTop: '5%'}}
                            >
                                Tutte le firme inviate correttamente
                            </Typography>
                        </Grid>
                    </Grid>
                </React.Fragment>
            );
        } else {
            return (
                <React.Fragment>
                    <div id="doc-zone">
                        {this.state.progress === true ? (
                            <LinearProgress/>
                        ) : (
                            <Grid container>
                                <Grid
                                    container
                                    item
                                    xs={12}
                                    alignContent="center"
                                    alignItems="center"
                                    justify="center"
                                >
                                    <Grid
                                        container
                                        item
                                        xs={12}
                                        alignContent="center"
                                        alignItems="center"
                                        justify="center"
                                    >
                                        <Grid
                                            container
                                            item
                                            xs={6}
                                            alignContent="center"
                                            alignItems="center"
                                            justify="center"
                                        >
                                            {this.props.Output[this.props.SignatureIndex] ? (
                                                <Button
                                                    color="secondary"
                                                    onClick={() => {
                                                        this.props.dispatch(
                                                            setOutput(
                                                                {
                                                                    user: this.state.signerNames[
                                                                        this.props.SignatureIndex
                                                                        ],
                                                                    coordinates: this.state.outputCoordinates
                                                                },
                                                                this.props.SignatureIndex
                                                            )
                                                        );

                                                        if (NoOfSigns === this.state.noOfSigners) {
                                                            this.setState({text: true});
                                                        } else {
                                                            this.props.dispatch(
                                                                setSignatureIndex(this.nextSignerIndex)
                                                            );
                                                            this.props.dispatch(setDocumentIndex(0));

                                                            this.setState({
                                                                outputCoordinates: null,
                                                                signerMode: true,
                                                                showCursor: false
                                                            });
                                                        }
                                                    }}
                                                    variant="contained"
                                                    fullWidth
                                                >
                                                    {NoOfSigns === this.state.noOfSigners
                                                        ? 'Salva'
                                                        : 'Prossimo Firmatario ( ' +
                                                        this.state.signerNames[this.nextSignerIndex] +
                                                        ' )'}
                                                </Button>
                                            ) : (
                                                <Typography noWrap>
                                                    Firmatario:{' '}
                                                    {this.state.signerNames[this.props.SignatureIndex]}
                                                </Typography>
                                            )}
                                        </Grid>
                                        <Grid
                                            container
                                            item
                                            xs={6}
                                            alignContent="center"
                                            alignItems="center"
                                            justify="center"
                                        >
                                            <Button
                                                color="primary"
                                                disabled={NoOfSigns > 0 ? false : true}
                                                onClick={e => {
                                                    this.toggleDrawer('right', true)(e);
                                                }}
                                                variant="contained"
                                                fullWidth
                                            >
                                                Elimina Firme
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    <div id="document-container">
                                    <ScrollContainer
                                        hideScrollbars={false}
                                        className="scroll-container main"
                                    >
                                        <img
                                            onClick={this._onMouseMove.bind(this)}
                                            id="document"
                                            alt="Document"
                                            onLoad={() => {
                                                $(function() {



                                                    $("#document")
                                                        .mousemove(function(e) {
                                                            $(".cursor")
                                                                .show()
                                                                .css({
                                                                    left: e.clientX,
                                                                    top: e.clientY + $("#testarea").scrollTop(),
                                                                    display: "block"
                                                                });
                                                        })
                                                        .mouseout(function(event) {
                                                            $(".cursor").hide();
                                                        });
                                                });
                                                this.setState({showCursor: true});
                                            }}
                                            src={
                                                this.state.documentData !== null
                                                    ? this.state.documentData
                                                    : ''
                                            }
                                        />
                                    </ScrollContainer>
                                        {this.state.showSignaturePreview === true && (
                                            <div id="preview-sign" style={{
                                                background: "green",
                                                position: 'absolute',
                                                left: this.state.previewX,
                                                top: this.state.previewY,
                                                width: this.state.originalSignWidth &&
                                                this.state.signerMode &&
                                                document.getElementById('document')
                                                    ? (this.state.originalSignWidth * (document.getElementById('document').width / this.state.originalWidth))
                                                    : '0px',
                                                height: this.state.originalSignHeight &&
                                                this.state.signerMode &&
                                                document.getElementById('document')
                                                    ? (this.state.originalSignHeight * (document.getElementById('document').height / this.state.originalHeight))
                                                    : '0px',

                                            }}>
                                            <img src={this.state.signatureData}
                                                 alt="signPreview"
                                                 className="signatureImage"
                                                 style={{
                                                     height:
                                                       '100%',
                                                     width:
                                                         '100%'
                                                 }}
                                                 />
                                            </div>
                                        )}
                                    </div>
                                    {this.state.showCursor === true && (
                                        <img
                                            src={
                                                this.state.signatureDataArray[this.props.SignatureIndex]
                                            }
                                            alt="Cursor"
                                            id={this.state.name}
                                            className="cursor"
                                            style={{
                                                position: 'absolute',
                                                width:
                                                    this.state.originalSignWidth &&
                                                    this.state.signerMode &&
                                                    document.getElementById('document')
                                                        ? (this.state.originalSignWidth * (document.getElementById('document').width / this.state.originalWidth))
                                                        : '0px',
                                                height:
                                                    this.state.originalSignHeight &&
                                                    this.state.signerMode &&
                                                    document.getElementById('document')
                                                        ? (this.state.originalSignHeight * (document.getElementById('document').height / this.state.originalHeight))
                                                        : '0px',
                                                cursor: 'none',
                                                pointerEvents: 'none',
                                                display: 'none',
                                                border: '1px solid black'
                                            }}
                                        />
                                    )}
                                </Grid>
                            </Grid>
                        )}
                        <SwipeableDrawer
                            anchor="right"
                            open={this.state.right}
                            onClose={this.toggleDrawer('right', false)}
                            onOpen={this.toggleDrawer('right', true)}
                        >
                            {this.sideList('right')}
                        </SwipeableDrawer>
                        {this.zoom()}
                    </div>
                </React.Fragment>

            );
        }
    }
}

const mapStateToProps = state => {
    return {
        DocumentIndex: state.DocumentIndex,
        SignatureIndex: state.SignatureIndex,
        Output: state.Output,
        NoOfDocuments: state.NoOfDocuments,
        ZoomValue: state.ZoomValue
    };
};
export default connect(mapStateToProps)(withStyles(styles)(Document));

