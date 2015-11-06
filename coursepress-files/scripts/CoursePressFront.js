var CoursePress = CoursePress || {};

(function ( $ ) {

    CoursePress.Models = CoursePress.Models || {};
    CoursePress.UI = CoursePress.UI || {};
    CoursePress.utility = CoursePress.utility || {};

    CoursePress.utility.timer_validate = function( s, ref ) {
        var time = "ref_" + (CoursePress.utility.hashcode( "" + s ) + "").split("").reverse().join("");
        return time == ref;
    }

    CoursePress.utility.checkPasswordStrength = function( $pass1,
                                                          $pass2,
                                                          $strengthResult,
                                                          $submitButton,
                                                          blacklistArray ) {
        var pass1 = $pass1.val();
        var pass2 = $pass2.val();

        // Reset the form & meter
        if( $submitButton ) {
            $submitButton.attr( 'disabled', 'disabled' );
        }
        $strengthResult.removeClass( 'short bad good strong' );

        // Extend our blacklist array with those from the inputs & site data
        blacklistArray = blacklistArray.concat( wp.passwordStrength.userInputBlacklist() )

        // Get the password strength
        var strength = wp.passwordStrength.meter( pass1, blacklistArray, pass2 );

        // Add the strength meter results
        switch ( strength ) {

            case 2:
                $strengthResult.addClass( 'bad' ).html( pwsL10n.bad );
                break;

            case 3:
                $strengthResult.addClass( 'good' ).html( pwsL10n.good );
                break;

            case 4:
                $strengthResult.addClass( 'strong' ).html( pwsL10n.strong );
                break;

            case 5:
                $strengthResult.addClass( 'short' ).html( pwsL10n.mismatch );
                break;

            default:
                $strengthResult.addClass( 'short' ).html( pwsL10n.short );

        }

        // The meter function returns a result even if pass2 is empty,
        // enable only the submit button if the password is strong and
        // both passwords are filled up
        if( $submitButton ) {
            if ( 2 < strength && strength !== 5 && '' !== pass2.trim() ) {
                $submitButton.removeAttr( 'disabled' );
            }
        }

        return strength;
    }

    // Copied from comment-reply.js
    CoursePress.utility.addComment = {
        moveForm : function(commId, parentId, respondId, postId) {
            var t = this, div, comm = t.I(commId), respond = t.I(respondId), cancel = t.I('cancel-comment-reply-link'), parent = t.I('comment_parent'), post = t.I('comment_post_ID');

            if ( ! comm || ! respond || ! cancel || ! parent )
                return;

            t.respondId = respondId;
            postId = postId || false;

            if ( ! t.I('wp-temp-form-div') ) {
                div = document.createElement('div');
                div.id = 'wp-temp-form-div';
                div.style.display = 'none';
                respond.parentNode.insertBefore(div, respond);
            }

            comm.parentNode.insertBefore(respond, comm.nextSibling);
            if ( post && postId )
                post.value = postId;
            parent.value = parentId;
            cancel.style.display = '';

            cancel.onclick = function() {
                var t = CoursePress.utility.addComment, temp = t.I('wp-temp-form-div'), respond = t.I(t.respondId);

                if ( ! temp || ! respond )
                    return;

                t.I('comment_parent').value = '0';
                temp.parentNode.insertBefore(respond, temp);
                temp.parentNode.removeChild(temp);
                this.style.display = 'none';
                this.onclick = null;
                return false;
            };

            try { t.I('comment').focus(); }
            catch(e) {}

            return false;
        },

        I : function(e) {
            return document.getElementById(e);
        }
    };


    // Actions and Filters
    CoursePress.actions = CoursePress.actions || {}; // Registered actions
    CoursePress.filters = CoursePress.filters || {}; // Registered filters

    /**
     * Add a new Action callback to CoursePress.actions
     *
     * @param tag The tag specified by do_action()
     * @param callback The callback function to call when do_action() is called
     * @param priority The order in which to call the callbacks. Default: 10 (like WordPress)
     */
    CoursePress.add_action = function( tag, callback, priority ) {

        if( typeof priority === "undefined" ) {
            priority = 10;
        }

        // If the tag doesn't exist, create it.
        CoursePress.actions[ tag ] = CoursePress.actions[ tag ] || [];
        CoursePress.actions[ tag ].push( { priority: priority, callback: callback } );

    }

    /**
     * Add a new Filter callback to CoursePress.filters
     *
     * @param tag The tag specified by apply_filters()
     * @param callback The callback function to call when apply_filters() is called
     * @param priority Priority of filter to apply. Default: 10 (like WordPress)
     */
    CoursePress.add_filter = function( tag, callback, priority ) {

        if( typeof priority === "undefined" ) {
            priority = 10;
        }

        // If the tag doesn't exist, create it.
        CoursePress.filters[ tag ] = CoursePress.filters[ tag ] || [];
        CoursePress.filters[ tag ].push( { priority: priority, callback: callback } );

    }

    /**
     * Remove an Anction callback from CoursePress.actions
     *
     * Must be the exact same callback signature.
     * Warning: Anonymous functions can not be removed.

     * @param tag The tag specified by do_action()
     * @param callback The callback function to remove
     */
    CoursePress.remove_action = function( tag, callback ) {

        CoursePress.filters[ tag ] = CoursePress.filters[ tag ] || [];

        CoursePress.filters[ tag ].forEach( function( filter, i ) {
            if( filter.callback === callback ) {
                CoursePress.filters[ tag ].splice(i, 1);
            }
        } );
    }

    /**
     * Remove a Filter callback from CoursePress.filters
     *
     * Must be the exact same callback signature.
     * Warning: Anonymous functions can not be removed.

     * @param tag The tag specified by apply_filters()
     * @param callback The callback function to remove
     */
    CoursePress.remove_filter = function( tag, callback ) {

        CoursePress.filters[ tag ] = CoursePress.filters[ tag ] || [];

        CoursePress.filters[ tag ].forEach( function( filter, i ) {
            if( filter.callback === callback ) {
                CoursePress.filters[ tag ].splice(i, 1);
            }
        } );
    }

    /**
     * Calls actions that are stored in CoursePress.actions for a specific tag or nothing
     * if there are no actions to call.
     *
     * @param tag A registered tag in Hook.actions
     * @options Optional JavaScript object to pass to the callbacks
     */
    CoursePress.do_action = function( tag, options ) {

        var actions = [];

        if( typeof CoursePress.actions[ tag ] !== "undefined" && CoursePress.actions[ tag ].length > 0 ) {

            CoursePress.actions[ tag ].forEach( function( hook ) {

                actions[ hook.priority ] = actions[ hook.priority ] || [];
                actions[ hook.priority ].push( hook.callback );

            } );

            actions.forEach( function( hooks ) {

                hooks.forEach( function( callback ) {
                    callback( options );
                } );

            } );
        }

    }

    /**
     * Calls filters that are stored in CoursePress.filters for a specific tag or return
     * original value if no filters exist.
     *
     * @param tag A registered tag in Hook.filters
     * @options Optional JavaScript object to pass to the callbacks
     */
    CoursePress.apply_filters = function( tag, value, options ) {

        var filters = [];

        if( typeof CoursePress.filters[ tag ] !== "undefined" && CoursePress.filters[ tag ].length > 0 ) {

            CoursePress.filters[ tag ].forEach( function( hook ) {

                filters[ hook.priority ] = filters[ hook.priority ] || [];
                filters[ hook.priority ].push( hook.callback );
            } );

            filters.forEach( function( hooks ) {

                hooks.forEach( function( callback ) {
                    value = callback( value, options );
                } );

            } );
        }

        return value;
    }


    CoursePress.Models.CourseFront = Backbone.Model.extend( {
        url: _coursepress._ajax_url + '?action=course_front',
        parse: function ( response, xhr ) {

            // Trigger course update events
            if ( true === response.success ) {
                this.set( 'response_data', response.data );
                this.trigger( 'coursepress:' + response.data.action + '_success', response.data );
            } else {
                this.set( 'response_data', {} );
                if( response.data ) {
                    this.trigger( 'coursepress:' + response.data.action + '_error', response.data );
                }
            }
        },
        defaults: {}
    } );

    // AJAX Posts
    CoursePress.Models.Post = CoursePress.Models.Post || Backbone.Model.extend( {
        url: _coursepress._ajax_url + '?action=',
        parse: function ( response, xhr ) {

            var context = this.get( 'context' );

            // Trigger course update events
            if ( true === response.success ) {

                if ( undefined === response.data ) {
                    response.data = {};
                }
                this.set( 'response_data', response.data );
                var method = 'coursepress:' + context + response.data.action + '_success';
                this.trigger( method, response.data );
            } else {
                if ( 0 !== response ) {
                    this.set( 'response_data', {} );
                    this.trigger( 'coursepress:' + context + response.data.action + '_error', response.data );
                }
            }
            CoursePress.Post.set( 'action', '' );
        },
        prepare: function ( action, context ) {
            this.url = this.get( 'base_url' ) + action;

            if ( undefined !== context ) {
                this.set( 'context', context )
            }
        },
        defaults: {
            base_url: _coursepress._ajax_url + '?action=',
            context: 'response:'
        }
    } );
    CoursePress.Post = new CoursePress.Models.Post();

    CoursePress.Enrollment = CoursePress.Enrollment || {};

    CoursePress.Page = CoursePress.Page || {};

    CoursePress.Enrollment.dialog = CoursePress.Enrollment.dialog || {}

    // Prepare the enrollment modal
    function create_modal_model() {

        $steps = $( '[data-type="modal-step"]' );

        if( typeof $steps == 'undefined' || $steps.length == 0 ) {
            return;
        }

        CoursePress.Enrollment.Modal = Backbone.Modal.extend( {
            template: _.template( $( '#modal-template' ).html() ),
            viewContainer: '.enrollment-modal-container',
            submitEl: '.done',
            cancelEl: '.cancel',
            options: 'meh',
            // Dynamically create the views from the templates.
            // This allows for WP filtering to add/remove steps
            views: (function () {

                var object = {};

                $.each( $steps, function ( index, item ) {
                    var step = index + 1;
                    var id = $( item ).attr( 'id' );
                    object[ 'click #step' + step ] = {
                        view: _.template( $( '#' + id ).html() ),
                        onActive: 'setActive'
                    };
                } );

                return object;
            })(),
            events: {
                'click .previous': 'previousStep',
                'click .next': 'nextStep'
            },
            previousStep: function ( e ) {
                e.preventDefault();
                this.previous();
                if ( typeof this.onPrevious === "function" ) {
                    this.onPrevious();
                }
            },
            nextStep: function ( e ) {
                e.preventDefault();
                this.next();
                if ( typeof this.onNext === "function" ) {
                    this.onNext();
                }
            },
            setActive: function( options ) {
                console.log( options );
                this.trigger( 'modal:updated', { view: this, options: options } );
            }
        } );

        // Create a modal view class
        CoursePress.Enrollment.dialog = new CoursePress.Enrollment.Modal();

        CoursePress.Enrollment.dialog.beforeSubmit = function() {
            var step = this.currentIndex;
            process_popup_enrollment( step );
            if( step === ( CoursePress.Enrollment.dialog.views.length - 1 ) ) {
                $('.enrolment-container-div' ).addClass('hidden');
            } else {

            }
            return false;
        }

        CoursePress.Enrollment.dialog.openAtAction = function( action ) {
            var steps = $( '[data-type="modal-step"]' );

            $.each( steps, function( i, step ) {
                var step_action = step.attr('data-modal-action');
                if( typeof step_action !== 'undefined' && action === step_action ) {
                    CoursePress.Enrollment.dialog.openAt( i );
                }
            });
        }

        CoursePress.Enrollment.dialog.on( 'modal:updated', function( e ) {
            //console.log( 'Activated...');
            //console.log( this.currentIndex );
        });


        // Dialog return actions
        CoursePress.Enrollment.dialog.handle_signup_return = function( data ) {

            var signup_errors = data['signup_errors'];

            if( signup_errors.length === 0 && data['user_data']['logged_in'] === true ) {

                // We're in! Now lets enroll
                CoursePress.Enrollment.dialog.attempt_enroll( data );

            } else {

                if( signup_errors.length > 0 ) {

                    $( '.bbm-wrapper #error-messages' ).html('');

                    // Display signup errors
                    var err_msg = '<ul>';
                    signup_errors.forEach( function ( item ) {
                        err_msg += '<li>' + item + '</li>';
                    } );
                    err_msg += '</ul>';

                    $( '.bbm-wrapper #error-messages' ).html( err_msg );
                    $( 'input[name=password]' ).val('');
                    $( 'input[name=password_confirmation]' ).val('');

                } else {

                    // Redirect to login
                    var steps = $( '[data-type="modal-step"]' );

                    $.each( steps, function( i, step ) {
                        var action = step.attr('data-modal-action');
                        if( typeof action !== 'undefined' && 'login' === action ) {
                            CoursePress.Enrollment.dialog.openAt( i );
                        }
                    });
                }

            }

        }

        CoursePress.Enrollment.dialog.handle_login_return = function( data ) {

            if( data['logged_in'] === true ) {
                if( ! data['already_enrolled'] ) {
                    CoursePress.Enrollment.dialog.attempt_enroll( data );
                } else {
                    location.href = _coursepress.course_url;
                }
            }
        }

        // Student successfully enrolled
        CoursePress.Enrollment.dialog.handle_enroll_student_return = function( data ) {

            var steps = $( '[data-type="modal-step"]' );

            if( true === data['success'] ) {
                $.each( steps, function ( i, step ) {
                    var action = $( step ).attr( 'data-modal-action' );
                    if ( typeof action !== 'undefined' && 'enrolled' === action ) {
                        CoursePress.Enrollment.dialog.openAt( i );
                    }
                } );
            }

            $('.enrolment-container-div' ).removeClass('hidden');

        }


        CoursePress.Enrollment.dialog.signup_validation = function() {

            var valid = true; // we're optimists
            $('.bbm-wrapper #error-messages' ).html('');

            var errors = [];
            // All fields required
            if (
                '' === $( 'input[name=first_name]' ).val().trim() ||
                '' === $( 'input[name=last_name]' ).val().trim() ||
                '' === $( 'input[name=username]' ).val().trim() ||
                '' === $( 'input[name=email]' ).val().trim() ||
                '' === $( 'input[name=password]' ).val().trim() ||
                '' === $( 'input[name=password_confirmation]' ).val().trim()
            ) {
                valid = false;
                errors.push( _coursepress.signup_errors['all_fields'] );
            }

            var strength = CoursePress.utility.checkPasswordStrength(
                $('input[name=password]'),         // First password field
                $('input[name=password_confirmation]'), // Second password field
                $('#password-strength'),           // Strength meter
                false,
                []        // Blacklisted words
            );

            // Can't have a weak password
            if( strength <= 2 ) {
                valid = false;
                errors.push( _coursepress.signup_errors['weak_password'] );
            }
            // Passwords must match
            if( strength === 5 ) {
                valid = false;
                errors.push( _coursepress.signup_errors['mismatch_password'] );
            }

            if( errors.length > 0 ) {
                var err_msg = '<ul>';
                errors.forEach( function ( item ) {
                    err_msg += '<li>' + item + '</li>';
                } );
                err_msg += '</ul>';

                $( '.bbm-wrapper #error-messages' ).html( err_msg );
            }

            return valid;

        }

        CoursePress.Enrollment.dialog.signup_data = function( data ) {

            data.first_name = $( 'input[name=first_name]' ).val();
            data.last_name = $( 'input[name=last_name]' ).val();
            data.username = $( 'input[name=username]' ).val();
            data.email = $( 'input[name=email]' ).val();
            data.password = $( 'input[name=password]' ).val();
            data.nonce = $( '.bbm-modal-nonce.signup' ).attr('data-nonce');

            return data;
        }

        CoursePress.Enrollment.dialog.login_data = function( data ) {
            var course_id = $( '.enrollment-modal-container.bbm-modal__views' ).attr('data-course');
            data.username = $( 'input[name=username]' ).val();
            data.password = $( 'input[name=password]' ).val();
            data.course_id = course_id;
            data.nonce = $( '.bbm-modal-nonce.login' ).attr('data-nonce');
            return data;
        }

        CoursePress.Enrollment.dialog.attempt_enroll = function( enroll_data ) {

            var nonce = $( '.enrollment-modal-container.bbm-modal__views' ).attr('data-nonce');
            var course_id = $( '.enrollment-modal-container.bbm-modal__views' ).attr('data-course');

            CoursePress.Post.prepare( 'course_enrollment', 'enrollment:' );
            CoursePress.Post.set( 'action', 'enroll_student' );

            var data = {
                nonce: nonce,
                student_id: enroll_data['user_data']['ID'],
                course_id: course_id,
                step: ''
            };

            CoursePress.Post.set( 'data', data );
            CoursePress.Post.save();

            // Manual hook here as this is not a step in the modal templates
            CoursePress.Post.off( 'coursepress:enrollment:enroll_student_success' );
            CoursePress.Post.on( 'coursepress:enrollment:enroll_student_success', function ( data ) {
                // Update nonce
                $( '.enrollment-modal-container.bbm-modal__views' ).attr('data-nonce', data['nonce'] );
                console.log(data);
                if( typeof data['callback'] !== 'undefined' ) {
                    var fn = CoursePress.Enrollment.dialog[ data['callback'] ];
                    if ( typeof fn === 'function' ) {
                        console.log('callback is next....' + data['callback'] );
                        fn( data );
                        return;
                    }
                }
            } );

        }

        // Password Indicator
        $( 'body' ).on( 'keyup', 'input[name=password], input[name=password_confirmation]',
            function( event ) {
                CoursePress.utility.checkPasswordStrength(
                    $('input[name=password]'),         // First password field
                    $('input[name=password_confirmation]'), // Second password field
                    $('#password-strength'),           // Strength meter
                    false, //$('.bbm-button.done.signup'),           // Submit button
                    []        // Blacklisted words
                );
            }
        );


    }


    // Init YouTube
    //var tag = document.createElement( 'script' );
    //tag.src = "https://www.youtube.com/iframe_api";
    //var firstScriptTag = document.getElementsByTagName( 'script' )[ 0 ];
    //firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );


    function render_popup_enrollment() {
        var newDiv = $(document.createElement('div'));
        $( 'body' ).append( newDiv );
        $( newDiv ).addClass('enrolment-container-div');
        if( _coursepress.current_student > 0 ) {

            // Is paid course?
            var is_paid = false; //debug

            if( ! is_paid ) {

                $(newDiv ).addClass('hidden');

                var enroll_data = {
                    user_data: {
                        ID: parseInt( _coursepress.current_student )
                    }
                };

                // We're logged in, so lets try to enroll
                CoursePress.Enrollment.dialog.attempt_enroll( enroll_data );

                $(newDiv).html(CoursePress.Enrollment.dialog.render().el);
            } else {


                $(newDiv).html(CoursePress.Enrollment.dialog.render().el);
                CoursePress.Enrollment.dialog.openAtAction('paid_enrollment');
            }



        } else {
            $(newDiv).html(CoursePress.Enrollment.dialog.render().el);
        }


    }

    function process_popup_enrollment( step ) {

        if( typeof step === "undefined" ) {
            return false;
        }

        var action = $( $( '[data-type="modal-step"]' )[ step ] ).attr('data-modal-action');
        var nonce = $( '.enrollment-modal-container.bbm-modal__views' ).attr('data-nonce');

        CoursePress.Post.prepare( 'course_enrollment', 'enrollment:' );
        CoursePress.Post.set( 'action', action );

        if( action == 'signup' ) {
            var fn = CoursePress.Enrollment.dialog[ 'signup_validation' ];
            if ( typeof fn === 'function' && true !== fn() ) {
                return;
            }
        }

        var data = {
            nonce: nonce,
            step: step
        };

        var fn = CoursePress.Enrollment.dialog[ action + '_data' ];
        if ( typeof fn === 'function' ) {
            data = fn( data );
        }

        CoursePress.Post.set( 'data', data );
        CoursePress.Post.save();

        CoursePress.Post.on( 'coursepress:enrollment:' + action + '_success', function ( data ) {

            // Update nonce
            $( '.enrollment-modal-container.bbm-modal__views' ).attr('data-nonce', data['nonce'] );
            console.log(data);
            if( typeof data['callback'] !== 'undefined' ) {
                var fn = CoursePress.Enrollment.dialog[ data['callback'] ];
                if ( typeof fn === 'function' ) {
                    console.log('callback is next....' + data['callback'] );
                    fn( data );
                    return;
                }
            }
            if( typeof data.last_step !== 'undefined' && parseInt( data.last_step ) < ( CoursePress.Enrollment.dialog.views.length -1 ) ) {
                CoursePress.Enrollment.dialog.openAt( parseInt( data.last_step ) + 1 );
                $('.enrolment-container-div' ).removeClass('hidden');
            }

        } );

        CoursePress.Post.on( 'coursepress:enrollment:' + action + '_error', function ( data ) {
            if( typeof data['callback'] !== 'undefined' ) {
                var fn = CoursePress.Enrollment.dialog[ data['callback'] ];
                if ( typeof fn === 'function' ) {
                    fn( data );
                    return;
                }

            }
        } );

    }

    function bind_enrollment_actions() {


        CoursePress.Post.on( 'coursepress:notification:delete_success', function ( data ) {
            location.reload();
        } );


    }

    function bind_buttons() {

        // Section Title Click
        $( '.unit-archive-list-wrapper .section-title' ).on( 'click', function( e ) {
            var link = $( $( $( this ).parents( '.unit-archive-single' )[0] ).find('a.unit-archive-single-title')[0] ).attr('href');
            var section_hash = 'section-' + $(this).attr('data-id');

            location.href = link + '#' + section_hash;
        } );

        // Module Title Click
        $( '.unit-archive-list-wrapper .module-title' ).on( 'click', function( e ) {
            var link = $( $( $( this ).parents( '.unit-archive-single' )[0] ).find('a.unit-archive-single-title')[0] ).attr('href');
            var mod_hash = 'module-' + $(this).attr('data-id');

            location.href = link + '#' + mod_hash;
        } );


        $( '.apply-button.signup, .apply-button.enroll' ).on( 'click', function( e ) {
           var target = e.currentTarget;
            var event = e || window.event;
            event.preventDefault();
            event.stopPropagation();
            render_popup_enrollment();

        });

        $( '.apply-button' ).on( 'click', function ( e ) {
            var target = e.currentTarget;

            if ( typeof $( target ).attr( 'data-link' ) !== 'undefined' && $( target ).attr( 'data-link' ).length > 0 ) {
                location.href = $( target ).attr( 'data-link' );
            }
        } );

        $( 'button' ).on( 'click', function ( e ) {
            var target = e.currentTarget;

            if ( typeof $( target ).attr( 'data-link' ) !== 'undefined' && $( target ).attr( 'data-link' ).length > 0 ) {
                location.href = $( target ).attr( 'data-link' );
            }
        } );

        // Make course boxes clickable
        $( '.course_list_box_item.clickable' ).on( 'click', function( e ) {
            var target = e.currentTarget;

            if ( typeof $( target ).attr( 'data-link' ) !== 'undefined' && $( target ).attr( 'data-link' ).length > 0 ) {
                location.href = $( target ).attr( 'data-link' );
            }
        } );


        $( '.li-locked-unit a' ).on('click', function( e ) {
            e.stopImmediatePropagation();
            e.preventDefault();
        } );


        //$( '.view-response' ).link_popup( { link_text:  _coursepress.workbook_view_answer });
        //$( '.view-response' ).link_popup( { link_text:  '<span class="dashicons dashicons-visibility"></span>' });
        $( '.workbook-table .view-response' ).link_popup( { link_text:  '<span class="dashicons dashicons-visibility"></span>', offset_x: -160 });
        $( '.workbook-table .feedback' ).link_popup( { link_text:  '<span class="dashicons dashicons-admin-comments"></span>' });


    }


    function bind_module_actions() {

        // Resubmit
        $( '.module-container .module-result .resubmit a' ).on( 'click', function ( e ) {

            var parent = $( this ).parents( '.module-container' );
            var elements = $( parent ).find( '.module-elements' );
            var response = $( parent ).find( '.module-response' );
            var result = $( parent ).find( '.module-result' );

            $( elements ).removeClass( 'hide' );
            $( response ).addClass( 'hide' );
            $( result ).addClass( 'hide' );

        } );


        // Validate File Selected
        $( '.module-container input[type=file]' ).on( 'change', function ( e ) {

            var parent = $( this ).parents( '.module-container' );
            var filename = $( this ).val();
            var extension = filename.split( '.' ).pop();
            var allowed_extensions = _.keys( _coursepress.allowed_student_extensions );

            var allowed_string = allowed_extensions.join( ', ' );

            var progress = $( parent ).find( '.upload-progress' );

            var allowed = _.contains( allowed_extensions, extension );

            $( progress ).find( '.invalid-extension' ).detach();

            if ( !allowed ) {
                $( progress ).append( '<span class="invalid-extension">' + _coursepress.invalid_upload_message + allowed_string + '</span>' );
            }

        } );

        // Submit Result
        $( '.module-submit-action' ).on( 'click', function ( e ) {

            var el = this;
            var parent = $( el ).parents( '.module-container' );
            var elements = $( parent ).find( '.module-elements' );
            var response = $( parent ).find( '.module-response' );
            var result = $( parent ).find( '.module-result' );

            var module_id = $( parent ).attr( 'data-module' );
            var module_type = $( parent ).attr( 'data-type' );
            var course_id = $( parent ).find( '[name=course_id]' ).val();
            var unit_id = $( parent ).find( '[name=unit_id]' ).val();
            var student_id = $( parent ).find( '[name=student_id]' ).val();
            var value = '';

            var not_valid = false;

            switch ( module_type ) {

                case 'input-checkbox':
                    value = [];
                    $.each( $( parent ).find( '[name="module-' + module_id + '"]:checked' ), function ( i, item ) {
                        value.push( $( item ).val() );
                    } );
                    not_valid = value.length === 0;
                    break;
                case 'input-radio':
                    var el = $( parent ).find( '[name="module-' + module_id + '"]:checked' );
                    if ( el ) {
                        value = $( el ).val();
                    } else {
                        not_valid = true;
                    }

                    break;
                case 'input-select':
                    value = $( parent ).find( '[name=module-' + module_id + ']' ).val();
                    break;
                case 'input-text':
                    value = $( parent ).find( '[name=module-' + module_id + ']' ).val();
                    not_valid = value.trim().length === 0;
                    break;
                case 'input-textarea':
                    value = $( parent ).find( '[name=module-' + module_id + ']' ).val();
                    not_valid = value.trim().length === 0;
                    break;
                case 'input-quiz':
                    value = [];
                    var questions = $( parent ).find( '.module-quiz-question' );

                    $.each( questions, function( qi, question) {
                        var answers = $( question).find('[type="checkbox"],[type="radio"]');
                        value[qi] = [];
                        $.each( answers, function( ai, answer ) {
                             value[qi][ai]= $(answer).is( ':checked' );
                        });
                    });

                    break;

                case 'input-upload':

                    if ( supportAjaxUploadWithProgress() ) {

                        var formData = new FormData();

                        var file = $( parent ).find( '[name=module-' + module_id + ']' )[ 0 ].files[ 0 ];

                        // Exit if extension not supported
                        var extension = file.name.split( '.' ).pop();
                        var allowed_extensions = _.keys( _coursepress.allowed_student_extensions );
                        var allowed = _.contains( allowed_extensions, extension );

                        if ( !allowed ) {
                            return;
                        }

                        var uri = '';
                        formData.append( 'course_action', 'upload-file' );
                        formData.append( 'course_id', course_id );
                        formData.append( 'unit_id', unit_id );
                        formData.append( 'module_id', module_id );
                        formData.append( 'student_id', student_id );
                        formData.append( 'src', 'ajax' );
                        formData.append( 'file', file );

                        var xhr = new XMLHttpRequest();

                        // Started
                        xhr.upload.addEventListener( 'loadstart', function ( e ) {

                            var progress = $( parent ).find( '.upload-progress' );
                            $( progress ).find( '.spinner' ).detach();
                            $( progress ).append( '<span class="image spinner">&#xf111</span>' );

                        }, false );
                        // Progress
                        xhr.upload.addEventListener( 'progress', function ( e ) {

                            var percent = e.loaded / e.total * 100;
                            var percent_el = $( parent ).find( '.upload-percent' );
                            percent = parseInt( percent );

                            if ( percent_el.length > 0 ) {
                                $( percent_el ).replaceWith( '<span class="upload-percent">' + percent + '%</span>' );
                            } else {
                                $( parent ).find( '.upload-progress' ).append( '<span class="upload-percent">' + percent + '%</span>' );
                            }

                        }, false );

                        xhr.upload.addEventListener( 'load', function ( e ) {
                            // Keep this here for future
                        }, false );

                        xhr.addEventListener( 'readystatechange', function ( e ) {
                            var status, text, readyState;
                            try {
                                readyState = e.target.readyState;
                                //text = e.target.responseText;
                                status = e.target.status;
                            }
                            catch ( err ) {
                                return;
                            }

                            // Set a default as ready state might trigger xhr requests
                            var data = { success: false };
                            try {
                                data = JSON.parse( e.target.responseText );
                            } catch( e ){}

                            if ( readyState == 4 && status == '200' && data.success ) {

                                $( parent ).find( '.upload-percent' ).detach();
                                $( parent ).find( '.upload-progress .spinner' ).detach();
                                $( result ).detach();
                                $( elements ).addClass( 'hide' );
                                $( response ).replaceWith( '<div class="module-response">' +
                                    '<p class="file_holder">' + _coursepress.file_uploaded_message + '</p>' +
                                    '</div>'
                                );

                            } else if( readyState == 4 ) {
                                $( parent ).find( '.upload-percent' ).detach();
                                $( parent ).find( '.upload-progress .spinner' ).detach();
                                $( result ).detach();
                                $( elements ).addClass( 'hide' );
                                $( response ).replaceWith( '<div class="module-response">' +
                                    '<p class="file_holder">' + _coursepress.file_upload_fail_message + '</p>' +
                                    '</div>'
                                );
                            }

                        }, false );

                        // Set up request
                        xhr.open( 'POST', uri, true );

                        // Fire!
                        xhr.send( formData );

                    } else {
                        $( parent ).find( 'form' ).submit();
                    }

                    // No processing past this point
                    return;

                    break;

            }

            if ( not_valid ) {
                return;
            }
            // Add Spinner
            $( elements ).find( '.response-processing' ).detach();
            $( elements ).find( '.module-submit-action' ).append( '<span class="response-processing image spinner">&#xf111</span>' );

            // Record Response
            var model = new CoursePress.Models.CourseFront();

            model.set( 'action', 'record_module_response' );
            model.set( 'course_id', course_id );
            model.set( 'unit_id', unit_id );
            model.set( 'module_id', module_id );
            model.set( 'student_id', student_id );
            model.set( 'response', value );
            model.set( 'module_type', module_type );

            model.save();

            model.on( 'coursepress:record_module_response_success', function ( data ) {
                console.log( data );
                $( elements ).find( '.response-processing' ).detach();

                $( result ).detach();
                $( elements ).addClass( 'hide' );


                var html = '';
                if( data.quiz_result_screen.length > 0 ) {

                    // Enable navigation after submit
                    $('.coursepress-focus-view .not-active').removeClass('not-active');

                    html = data.quiz_result_screen;

                    if( data.results.attributes.mandatory && ! data.results.passed ) {
                        $('.coursepress-focus-view .focus-nav-next').addClass('not-active');
                    }


                } else {
                    html = '<div class="module-response">' +
                        '<p class="file_holder">' + _coursepress.response_saved_message + '</p>' +
                        '</div>';
                }



                if( 0 === response.length ) {
                    $( parent ).append( html );
                } else {
                    $( response ).replaceWith( html );
                }


            } );

            model.on( 'coursepress:record_module_response_error', function ( data ) {
                $( elements ).find( '.response-processing' ).detach();

                $( result ).detach();
                $( elements ).addClass( 'hide' );

                var html = '<div class="module-response">' +
                    '<p class="file_holder">' + _coursepress.response_fail_message + '</p>' +
                    '</div>';

                if( 0 === response.length ) {
                    $( parent ).append( html );
                } else {
                    $( response ).replaceWith( html );
                }
            } );


        } );

    }

    function supportAjaxUploadWithProgress() {
        return supportFileAPI() && supportAjaxUploadProgressEvents() && supportFormData();
        // Is the File API supported?
        function supportFileAPI() {
            var fi = document.createElement( 'INPUT' );
            fi.type = 'file';
            return 'files' in fi;
        };
        // Are progress events supported?
        function supportAjaxUploadProgressEvents() {
            var xhr = new XMLHttpRequest();
            return !!(xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
        };
        // Is FormData supported?
        function supportFormData() {
            return !!window.FormData;
        }
    }


    function course_completion() {

        var model = new CoursePress.Models.CourseFront();

        model.set( 'action', 'calculate_completion' );
        model.set( 'course_id', _coursepress.current_course );
        model.set( 'student_id', _coursepress.current_student );
        model.save();

    }

    function external() {
        //$( 'input.knob' ).knob();

        var a_col = $( 'ul.units-archive-list a' ).css('color');
        var p_col = $( 'body' ).css('color').replace('rgb(', '' ).replace(')', '' ).split( ',');
        var init = { color: a_col }
        var circles = $( '.course-progress-disc' ).circleProgress( { fill: init, emptyFill: 'rgba(' + p_col[0] + ', ' + p_col[1] + ', ' + p_col[2] + ', .1)' });
        $.each( circles, function ( i, item ) {

            var parent = $( item ).parents('ul')[0];
            var a_col = $( parent ).find('a').css('color');

            $( item ).on( 'circle-animation-progress', function ( e, v ) {
                var obj = $( this ).data( 'circle-progress' ),
                    ctx = obj.ctx,
                    s = obj.size,
                    sv = (100 * v).toFixed(),
                    ov = (100 * obj.value ).toFixed(),
                    fill = obj.arcFill;
                sv = 100 - sv;
                if ( sv < ov ) {
                    sv = ov;
                }
                ctx.save();
                ctx.font = s / 4.5 + "px sans-serif";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = fill;
                ctx.fillText( sv + '%', s / 2 + s / 80, s / 2 );
                ctx.restore();
            } );

            $( item ).on( 'circle-animation-end', function ( e ) {
                var obj = $( this ).data( 'circle-progress' ),
                    ctx = obj.ctx,
                    s = obj.size,
                    sv = (100 * obj.value ).toFixed(),
                    fill = obj.arcFill;
                obj.drawFrame( obj.value );
                ctx.font = s / 4.5 + "px sans-serif";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = a_col;
                ctx.fillText( sv + '%', s / 2, s / 2 );
            } );

            // In case animation doesn't run
            var obj = $( item ).data( 'circle-progress' ),
                ctx = obj.ctx,
                s = obj.size,
                sv = (100 * obj.value ).toFixed(),
                fill = obj.arcFill;
            ctx.font = s / 4.5 + "px sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = fill;
            ctx.fillText( sv + '%', s / 2, s / 2 + s / 80 );


        } );

    }


    function bind_course_discussions() {

        $( '.course-discussion-content.new .button-links .submit-discussion' ).on( 'click', function( e ) {
            $( this ).parents( 'form' ).submit();
        } );

    }

    CoursePress.FocusMode = CoursePress.FocusMode || {};


    CoursePress.FocusMode.bind_focus_nav = function() {
        $( '.coursepress-focus-view .focus-nav-prev' ).off('click');
        $( '.coursepress-focus-view .focus-nav-next' ).off('click');
        $( '.coursepress-focus-view a.breadcrumb-course-unit-section.crumb' ).off('click');

        $( '.coursepress-focus-view .focus-nav-prev, .coursepress-focus-view .focus-nav-next' ).on('click', function( e ) {
            var type = $( this ).attr('data-type');
            var item_id = $( this ).attr('data-id');

            $( '.coursepress-focus-view .loader' ).removeClass('hidden');
            $( '.coursepress-focus-view .focus-main' ).hide( 'fast');

            var offset = 0;
            if( $('.entry-title' ).length > 0 ) {
                offset = $('.entry-title' ).offset().top - 32;
            } else {
                offset = 32;
            }
            offset = CoursePress.apply_filters( 'coursepress_focus_top_offset', offset );

            $( 'body,html' ).animate( { scrollTop: offset, duration: 100 } );

            CoursePress.FocusMode.load_focus_item( type, item_id );
        });

        $( 'a.breadcrumb-course-unit-section.crumb, a.breadcrumb-course-unit.crumb' ).on('click', function( e ) {
            var type = 'section'
            var item_id = $( this ).attr('data-id');

            $( '.coursepress-focus-view .loader' ).removeClass('hidden');
            $( '.coursepress-focus-view .focus-main' ).hide( 'fast');

            var offset = 0;
            if( $('.entry-title' ).length > 0 ) {
                offset = $('.entry-title' ).offset().top - 32;
            } else {
                offset = 32;
            }
            offset = CoursePress.apply_filters( 'coursepress_focus_top_offset', offset );

            $( 'body,html' ).animate( { scrollTop: offset, duration: 100 } );

            CoursePress.FocusMode.load_focus_item( type, item_id );
        });

    }

    CoursePress.FocusMode.load_focus_item = function( type, item_id ) {

        CoursePress.Post.prepare( 'course_front', 'focus:' );
        CoursePress.Post.set( 'action', 'get_unit_' + type );

        if( typeof item_id === 'undefined' || item_id.length === 0 ) {
            item_id = 1;
        }

        var element = $('.coursepress-focus-view' );

        var data = {
            course_id: $( element ).attr('data-course'),
            unit_id: $( element ).attr('data-unit'),
            type: type,
            item_id: item_id
        };

        $('.coursepress-focus-view' ).load( _coursepress.home_url + '/coursepress_focus/' + data.course_id + '/' + data.unit_id + '/' + data.type + '/' + data.item_id, function() {
            CoursePress.FocusMode.bind_focus_nav();
            CoursePress.Page.init();

            // Audio Player Fix
            $( 'audio' ).css( 'visibility', 'visible' );
            $( 'audio' ).css( 'outline', 'none' );

            // ScrollTop
            //$( 'body,html' ).scrollTop( $( '.coursepress-focus-view' ).offset().top);
            //$( 'body,html' ).scrollTop(0);
            //$( 'body,html' ).animate( { scrollTop: $( '.coursepress-focus-view' ).offset().top - 32, duration: 200 } );
            $( '.quiz_timer').coursepress_timer( {
                toggle_element: $('.quiz_timer').siblings('.module-quiz-questions'),
                seconds: parseInt( $('.quiz_timer').attr('data-time') ),
                action: "none",
                running: false
            } );
            $( '.quiz_timer').on('timer_started', function( e ) {
                console.log('IT HAS STARTED!');
            });

            $( '.quiz_timer').on('timer_ended', function( e ) {
               console.log('IT HAS FINISHED!');
            });

            $( '.coursepress-focus-view .comment-reply-link').on('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            });

        } );

        //
        //CoursePress.Post.set( 'data', data );
        //CoursePress.Post.save();
        //
        //// Manual hook here as this is not a step in the modal templates
        //CoursePress.Post.off( 'coursepress:focus:get_unit_' + type + '_success' );
        //CoursePress.Post.on( 'coursepress:focus:get_unit_' + type + '_success', function ( data ) {
        //    // Update nonce
        //    //$( '.enrollment-modal-container.bbm-modal__views' ).attr('data-nonce', data['nonce'] );
        //    console.log(data.section_info.content);
        //    //if( typeof data['callback'] !== 'undefined' ) {
        //    //    var fn = CoursePress.Enrollment.dialog[ data['callback'] ];
        //    //    if ( typeof fn === 'function' ) {
        //    //        console.log('callback is next....' + data['callback'] );
        //    //        fn( data );
        //    //        return;
        //    //    }
        //    //}
        //} );
        //
        //CoursePress.Post.off( 'coursepress:focus:get_unit_' + type + '_error' );
        //CoursePress.Post.on( 'coursepress:focus:get_unit_' + type + '_error', function ( data ) {
        //    // Update nonce
        //    //$( '.enrollment-modal-container.bbm-modal__views' ).attr('data-nonce', data['nonce'] );
        //    console.log(data);
        //    //if( typeof data['callback'] !== 'undefined' ) {
        //    //    var fn = CoursePress.Enrollment.dialog[ data['callback'] ];
        //    //    if ( typeof fn === 'function' ) {
        //    //        console.log('callback is next....' + data['callback'] );
        //    //        fn( data );
        //    //        return;
        //    //    }
        //    //}
        //} );

    }

    CoursePress.FocusMode.init_focus_mode = function() {

        var is_module = location.hash.match(/^#module-/ ) !== null;
        var is_section = location.hash.match(/^#section-/) !== null;
        var section = 1;

        if( ! is_module && ! is_section ) {
            is_section = true;
        }

        if( is_module ) {
            var item_id =  location.hash.replace('#module-', '');
            CoursePress.FocusMode.load_focus_item( 'module', item_id );
        }

        if( is_section ) {
            var item_id = location.hash;

            if( typeof item_id === 'undefined' || item_id.length === 0 ) {
                var element = $('.coursepress-focus-view');
                item_id = $( element ).attr('data-page');
            }

            item_id = item_id.replace( '#section-', '' );

            CoursePress.FocusMode.load_focus_item( 'section', item_id );
        }

    }

    function bind_focus_mode() {
        var focus_active = $('.coursepress-focus-view');

        if( typeof focus_active !== 'undefined' && focus_active.length > 0 ) {
            CoursePress.FocusMode.init_focus_mode();
        }
    }

    CoursePress.Page.init = function() {

        var is_focus_mode = $('.coursepress-focus-view').length > 0;

        bind_buttons();

        bind_module_actions();

        bind_course_discussions();

        external();


        // TIMER
        if( ! is_focus_mode ) {
            $( '.quiz_timer').coursepress_timer();
            $( '.quiz_timer').on('timer_started', function( e ) {
                console.log('IT HAS STARTED!');
            });

            $( '.quiz_timer').on('timer_ended', function( e ) {
                console.log('IT HAS FINISHED!');
            });
        }


    };


    $( document ).ready( function ( $ ) {


        CoursePress.Page.init();

        create_modal_model();

        bind_focus_mode();

        course_completion();

        bind_enrollment_actions();

    } );


})( jQuery );


CoursePress.current = CoursePress.current || {};

//function onYouTubeIframeAPIReady() {
//
//    var $ = jQuery;
//
//    // Course Featured Video
//    var videoID = $( '#feature-video-div' ).attr( 'data-video' );
//    var width = $( '#feature-video-div' ).attr( 'data-width' );
//    var height = $( '#feature-video-div' ).attr( 'data-height' );
//    CoursePress.current.featuredVideo = new YT.Player( 'feature-video-div',
//        {
//            videoId: videoID,
//            width: width,
//            height: height,
//            playerVars: { 'controls': 0, 'modestbranding': 1, 'rel': 0, 'showinfo': 0 },
//            events: {
//                //'onReady': function( event ) {}
//                //'onPlaybackQualityChange': onPlayerPlaybackQualityChange,
//                //'onStateChange': onPlayerStateChange,
//                //'onError': onPlayerError
//            }
//        }
//    );
//
//}




