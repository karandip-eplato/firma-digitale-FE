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
import Konva from 'konva';

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
        window.window.parent.postMessage(obj, '*');
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
    imgSignatureGroup;

    resizedataURL(datas, wantedWidth, wantedHeight) {
        // We create an image to receive the Data URI
        const img = new Image();

        // When the event "onload" is triggered we can resize the image.
        img.onload = function () {
            // We create a canvas and get its context.
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // We set the dimensions at the wanted size.
            canvas.width = wantedWidth;
            canvas.height = wantedHeight;

            // We resize the image with the canvas method drawImage();
            ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);

            canvas.toDataURL();

            /////////////////////////////////////////
            // Use and treat your Data URI here !! //
            /////////////////////////////////////////
        };

        // We put the Data URI in the image's src attribute
        img.src = datas;
    }

    mergeImage() {
        const sign = this.imgSignatureGroup.get('Image')[0];
        const newHeight = sign.height() * (this.state.originalHeight / document.getElementById('document').height) / this.state.scaleFor72DPI
        const newWidth = sign.width() * (this.state.originalWidth / document.getElementById('document').width) / this.state.scaleFor72DPI
        this._onMouseMove(sign.absolutePosition().x, sign.absolutePosition().y, sign.width(), sign.height(), newHeight, newWidth);
        // this.imgSignatureGroup.destroy();
    }

    placeSignatureOnImageWithoutMerging(e) {
        const signHeight = document.getElementById('document-container')
            ? (this.state.originalSignHeight * (document.getElementById('document').height / this.state.originalHeight))
            : '0px';
        const signWidth = document.getElementById('document-container')
            ? (this.state.originalSignWidth * (document.getElementById('document').width / this.state.originalWidth))
            : '0px'
        // KONVA js
        // inserire aletzza e larghezza di firma da dare al div contenitore
        let width = document.getElementById('document').offsetWidth;
        let height = document.getElementById('document').offsetHeight;


        this.setState({
            previewY: (document.body.scrollHeight - document.getElementById('document-container').offsetHeight),
            previewX: (document.body.scrollWidth - document.getElementById('document-container').offsetWidth) / 2,
        })

        const stage = new Konva.Stage({
            container: 'preview-sign',
            width: width,
            height: height,
        });

        const layer = new Konva.Layer();
        stage.add(layer);


        const signatureImage = new Konva.Image({
            height: signHeight,
            width: signWidth
        });



        const imgWidth = document.getElementById('document').width;
        const imgHeight = document.getElementById('document').height;

        this.imgSignatureGroup = new Konva.Group({
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
            draggable: true,
        });
        layer.add(this.imgSignatureGroup);
        this.imgSignatureGroup.add(signatureImage);
        this.addAnchor(this.imgSignatureGroup, 0, 0, 'topLeft');
        this.addAnchor(this.imgSignatureGroup, signWidth, 0, 'topRight');
        this.addAnchor(this.imgSignatureGroup, signWidth, signHeight, 'bottomRight');
        this.addAnchor(this.imgSignatureGroup, 0, signHeight, 'bottomLeft');


        const imageObj1 = new Image();
        imageObj1.onload = function () {
            signatureImage.image(imageObj1);
            layer.draw();
        };
        imageObj1.src = this.state.signatureData;
        // Abilito il tasto "prossimo firmatario"
        const img = this.imgSignatureGroup.get('Image')[0]
        const outputCoordinates = {
            pageNo: this.props.DocumentIndex + 1,
            x: img.absolutePosition().x * (this.state.originalWidth / imgWidth),
            // y: y * (this.state.originalHeight / imgHeight) + parseInt(this.state.originalSignHeight)
            y: img.absolutePosition().y * (this.state.originalHeight / imgHeight),
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
    }

    update(activeAnchor) {
        const group = activeAnchor.getParent();

        const topLeft = group.get('.topLeft')[0];
        const topRight = group.get('.topRight')[0];
        const bottomRight = group.get('.bottomRight')[0];
        const bottomLeft = group.get('.bottomLeft')[0];
        const image = group.get('Image')[0];

        const anchorX = activeAnchor.getX();
        const anchorY = activeAnchor.getY();

        // update anchor positions
        switch (activeAnchor.getName()) {
            case 'topLeft':
                topRight.y(anchorY);
                bottomLeft.x(anchorX);
                break;
            case 'topRight':
                topLeft.y(anchorY);
                bottomRight.x(anchorX);
                break;
            case 'bottomRight':
                bottomLeft.y(anchorY);
                topRight.x(anchorX);
                break;
            case 'bottomLeft':
                bottomRight.y(anchorY);
                topLeft.x(anchorX);
                break;
        }

        image.position(topLeft.position());

        const width = topRight.getX() - topLeft.getX();
        const height = bottomLeft.getY() - topLeft.getY();
        if (width && height) {
            image.width(width);
            image.height(height)
        }
    }

    addAnchor(group, x, y, name) {
        const stage = group.getStage();
        const layer = group.getLayer();

        const anchor = new Konva.Circle({
            x: x,
            y: y,
            stroke: '#666',
            fill: '#ddd',
            strokeWidth: 2,
            radius: 8,
            name: name,
            draggable: true,
            dragOnTop: false,
        });

        anchor.on('dragmove', () => {
            this.update(anchor);
            layer.draw();
        });
        anchor.on('mousedown touchstart', function () {
            group.draggable(false);
            this.moveToTop();
        });
        anchor.on('dragend', function () {
            group.draggable(true);
            layer.draw();
        });
        // add hover styling
        anchor.on('mouseover', function () {
            const layer = this.getLayer();
            document.body.style.cursor = 'pointer';
            this.strokeWidth(4);
            layer.draw();
        });
        anchor.on('mouseout', function () {
            const layer = this.getLayer();
            document.body.style.cursor = 'default';
            this.strokeWidth(2);
            layer.draw();
        });

        group.add(anchor);
    }

    mergeSignatureOnDocument(mergeArray, baseDoc) {
        return mergeImages([
            {
                src: baseDoc,
                x: 0,
                y: 0
            },
            ...mergeArray
        ])
    }


    // Metodo che viene chiamato quando clicco per depositare la firma
    _onMouseMove(x, y, w, h, newHeightIn72Dpi, newWidthIn72Dpi) {
        if (this.state.signerMode === true) {
            const docWidth = document.getElementById('document').width;
            const docHeight = document.getElementById('document').height;
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
                            // TODO questo height deve essere quello aggiornato
                            imgHeight: element.coordinates.originalHeight,
                            imgData: this.imgSignatureGroup.get('Image')[0].toDataURL(),
                            newHeightIn72Dpi: element.coordinates.newHeightIn72Dpi,
                            newWidthIn72Dpi: element.coordinates.newWidthIn72Dpi,
                        });
                }
            });

            mergeImages([
                {
                    src: this.originalDocument,
                    x: 0,
                    y: 0
                },
                ...mergeData,
                {
                    src: this.state.signatureData,
                    x: x * (this.state.originalWidth / docWidth),
                    y: y * (this.state.originalHeight / docHeight),
                }
            ]).then(b64 => {

                // Resize immagine di firma
                const base64 = this.imgSignatureGroup.get('Image')[0];
                const tempWidth = (this.state.originalWidth / docWidth) * w
                const tempHeight = (this.state.originalHeight / docHeight) * h
                base64.width(tempWidth);
                base64.height(tempHeight)
                this.imgSignatureGroup.destroy();

                let outputCoordinates = this.state.outputCoordinates;
                outputCoordinates = {
                    pageNo: this.props.DocumentIndex + 1,
                    x: x * (this.state.originalWidth / docWidth),
                    // y: y * (this.state.originalHeight / imgHeight) + parseInt(this.state.originalSignHeight)
                    y: y * (this.state.originalHeight / docHeight),
                    newHeightIn72Dpi: newHeightIn72Dpi,
                    newWidthIn72Dpi: newWidthIn72Dpi,
                    originalHeight: tempHeight,
                    imgData: base64.toDataURL()
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

                let NoOfSigns = 0;
                this.props.Output.forEach(element => {
                    if (element) {
                        NoOfSigns = NoOfSigns + 1;
                    }
                });
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
            });
        }
    }

    zoom = () => {
        const myImg = document.getElementById('document');
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
                        const urlCreator = window.URL || window.webkitURL;
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
                                            src: element.coordinates.imgData,
                                            x: element.coordinates.x,
                                            y: element.coordinates.y,
                                        });
                                }
                            });
                            this.mergeSignatureOnDocument(mergeData, documentData)
                                .then(b64 => {
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
                            if (currentDocumentIndex === element.coordinates.pageNo - 1)
                                mergeData.push({
                                    src: element.coordinates.imgData,
                                    x: element.coordinates.x,
                                    y: element.coordinates.y,
                                });
                        }
                    });
                    this.mergeSignatureOnDocument(mergeData, documentData)
                        .then(b64 => {
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
                    '/getImage?pdfName=' +
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
                                                y: element.coordinates.y,
                                                width: 100,
                                                height: 100
                                            });
                                    }
                                });
                                this.mergeSignatureOnDocument(mergeData, documentData)
                                    .then(b64 => {
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
                                    const urlCreator = window.URL || window.webkitURL;
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
                                                        y: element.coordinates.y,
                                                        width: 100,
                                                        height: 100
                                                    });
                                            }
                                        });
                                        this.mergeSignatureOnDocument(mergeData, documentData)
                                            .then(b64 => {
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
                                            y: element.coordinates.y,
                                            width: 100,
                                            height: 100
                                        });
                                }
                            });
                            this.mergeSignatureOnDocument(mergeData, documentData)
                                .then(b64 => {
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
        this.props.Output.forEach(element => {
            if (element) {
                const coordinateY = (this.state.originalHeight - (((element.coordinates.y + element.coordinates.originalHeight) * this.state.dpi) / this.state.dpi)) / this.state.scaleFor72DPI;
                const coordinateX = ((element.coordinates.x * this.state.dpi) / this.state.dpi) / this.state.scaleFor72DPI;
                const tempCoordinates = {
                    pageNo: element.coordinates.pageNo,
                    x: coordinateX >= 0 ? coordinateX : 0,
                    y: coordinateY >= 0 ? coordinateY : 0
                };
                const newSize = {
                    h: element.coordinates.newHeightIn72Dpi,
                    w: element.coordinates.newWidthIn72Dpi
                }
                const temp = {
                    user: element.user,
                    coordinates: tempCoordinates,
                    size: newSize
                };
                output.push(temp);
            } else {
                output.push(null);
            }
        });
        window.window.parent.postMessage(output, '*');
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
                                                        this.mergeImage();
                                                        // this.props.dispatch(
                                                        //     setOutput(
                                                        //         {
                                                        //             user: this.state.signerNames[
                                                        //                 this.props.SignatureIndex
                                                        //                 ],
                                                        //             coordinates: this.state.outputCoordinates
                                                        //         },
                                                        //         this.props.SignatureIndex
                                                        //     )
                                                        // );
                                                        //
                                                        //
                                                        // if (NoOfSigns === this.state.noOfSigners) {
                                                        //     this.setState({text: true});
                                                        // } else {
                                                        //     this.props.dispatch(
                                                        //         setSignatureIndex(this.nextSignerIndex)
                                                        //     );
                                                        //     this.props.dispatch(setDocumentIndex(0));
                                                        //
                                                        //     this.setState({
                                                        //         outputCoordinates: null,
                                                        //         signerMode: true,
                                                        //         showCursor: false
                                                        //     });
                                                        // }
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
                                                onClick={this.placeSignatureOnImageWithoutMerging.bind(this)}
                                                id="document"
                                                alt="Document"
                                                onLoad={() => {
                                                    $(function () {


                                                        $("#document")
                                                            .mousemove(function (e) {
                                                                $(".cursor")
                                                                    .show()
                                                                    .css({
                                                                        left: e.clientX,
                                                                        top: e.clientY + $("#testarea").scrollTop(),
                                                                        display: "block"
                                                                    });
                                                            })
                                                            .mouseout(function (event) {
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

                                        <div id="preview-sign" style={{
                                            // background: "green",
                                            position: 'absolute',
                                            top: this.state.previewY,
                                            left: this.state.previewX

                                        }}>
                                            {/*<img src={this.state.signatureData}*/}
                                            {/*     alt="signPreview"*/}
                                            {/*     className="signatureImage"*/}
                                            {/*     style={{*/}
                                            {/*         height:*/}
                                            {/*           '100%',*/}
                                            {/*         width:*/}
                                            {/*             '100%'*/}
                                            {/*     }}*/}
                                            {/*     />*/}
                                        </div>

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

